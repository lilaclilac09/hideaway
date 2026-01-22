//! Share File Instruction
//!
//! Sets up MPC sharing or time-locked access for a file.

use crate::error::HideAwayError;
use crate::state::FileVault;
use pinocchio::{
    account_info::AccountInfo,
    pubkey::Pubkey,
    ProgramResult,
};

/// Expected accounts for ShareFile instruction:
/// 0. [signer] owner - File owner
/// 1. [writable] file_vault - FileVault account
///
/// Instruction data:
/// - discriminator: u8 (already consumed)
/// - share_type: u8 (0 = MPC, 1 = TimeLock, 2 = LitCondition)
/// - mpc_share_count: u8 (if share_type = 0)
/// - time_lock_expiry: i64 (if share_type = 1)
/// - access_flags: u8 (if share_type = 2)
pub fn process_share_file(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Validate accounts
    if accounts.len() < 2 {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let owner = &accounts[0];
    let file_vault = &accounts[1];

    // Validate signer
    if !owner.is_signer {
        return Err(HideAwayError::NotSigner.into());
    }

    // Validate writable
    if !file_vault.is_writable {
        return Err(HideAwayError::NotWritable.into());
    }

    // Validate file vault exists
    if file_vault.data_len() < FileVault::SIZE {
        return Err(HideAwayError::FileVaultNotFound.into());
    }

    // Parse FileVault
    let mut vault_data = file_vault.data.borrow_mut();
    let mut vault = FileVault::from_bytes(&vault_data)
        .ok_or(HideAwayError::InvalidDiscriminator)?;

    if !vault.is_valid_discriminator() {
        return Err(HideAwayError::InvalidDiscriminator.into());
    }

    // Verify owner
    if vault.owner != *owner.key {
        return Err(HideAwayError::Unauthorized.into());
    }

    // Parse instruction data
    if instruction_data.is_empty() {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let share_type = instruction_data[0];

    match share_type {
        0 => {
            // MPC sharing
            if instruction_data.len() < 2 {
                return Err(HideAwayError::InvalidInstruction.into());
            }
            let mpc_share_count = instruction_data[1];
            if mpc_share_count == 0 || mpc_share_count > 10 {
                return Err(HideAwayError::InvalidMpcShare.into());
            }
            vault.mpc_share_count = mpc_share_count;
            vault.access_flags |= 0x02; // Enable MPC sharing flag
        }
        1 => {
            // Time lock
            if instruction_data.len() < 9 {
                return Err(HideAwayError::InvalidInstruction.into());
            }
            let time_lock_expiry = i64::from_le_bytes(
                instruction_data[1..9].try_into().map_err(|_| HideAwayError::InvalidInstruction)?
            );
            if time_lock_expiry <= vault.uploaded_at {
                return Err(HideAwayError::InvalidInstruction.into());
            }
            vault.time_lock_expiry = time_lock_expiry;
        }
        2 => {
            // Lit conditions
            if instruction_data.len() < 2 {
                return Err(HideAwayError::InvalidInstruction.into());
            }
            let access_flags = instruction_data[1];
            vault.access_flags |= 0x04; // Enable Lit conditions flag
            vault.access_flags |= access_flags & 0x01; // Set ZK proof flag if needed
        }
        _ => {
            return Err(HideAwayError::InvalidInstruction.into());
        }
    }

    // Write updated vault back
    let vault_bytes = vault.to_bytes();
    vault_data[..vault_bytes.len()].copy_from_slice(&vault_bytes);

    Ok(())
}
