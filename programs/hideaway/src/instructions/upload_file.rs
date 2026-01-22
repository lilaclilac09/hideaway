//! Upload File Instruction
//!
//! Uploads a file by storing its hash commitment and encrypted IPFS CID on-chain.

use crate::error::HideAwayError;
use crate::pda::{create_file_vault_address_with_bump, file_vault_seeds};
use crate::state::{FileVault, HASH_LENGTH};
use pinocchio::{
    account_info::AccountInfo,
    program::invoke_signed,
    pubkey::Pubkey,
    ProgramResult,
    system_program,
};

/// Expected accounts for UploadFile instruction:
/// 0. [signer] owner - File owner
/// 1. [writable] file_vault - FileVault PDA account
/// 2. [] system_program - System program
///
/// Instruction data:
/// - discriminator: u8 (already consumed)
/// - file_hash: [u8; 32]
/// - salt: [u8; 32]
/// - encrypted_cid_length: u8
/// - encrypted_cid: [u8; encrypted_cid_length]
pub fn process_upload_file(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Validate accounts
    if accounts.len() < 3 {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let owner = &accounts[0];
    let file_vault = &accounts[1];
    let system_program = &accounts[2];

    // Validate signer
    if !owner.is_signer {
        return Err(HideAwayError::NotSigner.into());
    }

    // Validate writable
    if !file_vault.is_writable {
        return Err(HideAwayError::NotWritable.into());
    }

    // Validate system program
    if system_program.key != &system_program::ID {
        return Err(HideAwayError::InvalidOwner.into());
    }

    // Parse instruction data
    if instruction_data.len() < 1 + HASH_LENGTH + HASH_LENGTH + 1 {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let mut offset = 0;

    // Parse file_hash (32 bytes)
    let mut file_hash = [0u8; HASH_LENGTH];
    file_hash.copy_from_slice(&instruction_data[offset..offset + HASH_LENGTH]);
    offset += HASH_LENGTH;

    // Parse salt (32 bytes)
    let mut salt = [0u8; HASH_LENGTH];
    salt.copy_from_slice(&instruction_data[offset..offset + HASH_LENGTH]);
    offset += HASH_LENGTH;

    // Parse CID length
    let cid_length = instruction_data[offset];
    offset += 1;

    if cid_length == 0 || cid_length > 128 {
        return Err(HideAwayError::InvalidCidLength.into());
    }

    // Parse encrypted CID
    if instruction_data.len() < offset + cid_length as usize {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let encrypted_cid = &instruction_data[offset..offset + cid_length as usize];

    // Check if file vault already exists
    if file_vault.data_len() > 0 {
        return Err(HideAwayError::FileAlreadyExists.into());
    }

    // Derive PDA
    // Try all possible bumps (0-255)
    let mut bump = 0u8;
    let vault_pubkey = loop {
        if let Some(pubkey) = create_file_vault_address_with_bump(program_id, owner.key, &file_hash, bump) {
            if pubkey == *file_vault.key {
                break pubkey;
            }
        }
        bump = bump.checked_add(1)?;
        if bump == 0 {
            return Err(HideAwayError::InvalidPda.into());
        }
    };

    // Get current timestamp (simplified - in production use Clock sysvar)
    let uploaded_at = 0i64; // TODO: Get from Clock sysvar

    // Create FileVault
    let vault = FileVault::new(bump, *owner.key, file_hash, salt, encrypted_cid, uploaded_at)
        .map_err(|_| HideAwayError::InvalidCidLength)?;

    // Calculate space needed
    let space = FileVault::SIZE;
    let lamports_required = (space as f64 * 0.00000089) as u64 + 1_000_000; // Rent exemption

    // Create account
    invoke_signed(
        &system_program::create_account(
            owner.key,
            file_vault.key,
            lamports_required,
            space as u64,
            program_id,
        ),
        &[owner.clone(), file_vault.clone(), system_program.clone()],
        &[&file_vault_seeds(
            owner.key.as_ref(),
            &file_hash,
            &[bump],
        )],
    )?;

    // Write vault data
    let vault_bytes = vault.to_bytes();
    file_vault.data.borrow_mut()[..vault_bytes.len()].copy_from_slice(&vault_bytes);

    Ok(())
}
