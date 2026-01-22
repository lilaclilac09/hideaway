//! Access File Instruction
//!
//! Verifies file hash and optionally checks ZK proof for accessing a file.

use crate::error::HideAwayError;
use crate::state::FileVault;
use pinocchio::{
    account_info::AccountInfo,
    pubkey::Pubkey,
    ProgramResult,
};

/// Expected accounts for AccessFile instruction:
/// 0. [signer] accessor - User accessing the file
/// 1. [] file_vault - FileVault account
///
/// Instruction data:
/// - discriminator: u8 (already consumed)
/// - file_hash: [u8; 32] - Hash to verify against stored hash
/// - zk_proof_length: u8 (optional, 0 = no proof)
/// - zk_proof: [u8; zk_proof_length] (optional)
pub fn process_access_file(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Validate accounts
    if accounts.len() < 2 {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    let accessor = &accounts[0];
    let file_vault = &accounts[1];

    // Validate signer
    if !accessor.is_signer {
        return Err(HideAwayError::NotSigner.into());
    }

    // Validate file vault exists
    if file_vault.data_len() < FileVault::SIZE {
        return Err(HideAwayError::FileVaultNotFound.into());
    }

    // Parse FileVault
    let vault_data = file_vault.data.borrow();
    let vault = FileVault::from_bytes(&vault_data)
        .ok_or(HideAwayError::InvalidDiscriminator)?;

    if !vault.is_valid_discriminator() {
        return Err(HideAwayError::InvalidDiscriminator.into());
    }

    // Parse instruction data
    if instruction_data.len() < 32 {
        return Err(HideAwayError::InvalidInstruction.into());
    }

    // Parse provided file_hash
    let mut provided_hash = [0u8; 32];
    provided_hash.copy_from_slice(&instruction_data[0..32]);

    // Verify hash matches
    if provided_hash != vault.file_hash {
        return Err(HideAwayError::HashMismatch.into());
    }

    // Check authorization
    // Owner can always access
    if vault.owner != *accessor.key {
        // Check if ZK proof is required
        if vault.requires_zk_proof() {
            // Parse ZK proof if provided
            if instruction_data.len() < 33 {
                return Err(HideAwayError::InvalidProof.into());
            }

            let proof_length = instruction_data[32];
            if proof_length == 0 {
                return Err(HideAwayError::InvalidProof.into());
            }

            if instruction_data.len() < 33 + proof_length as usize {
                return Err(HideAwayError::InvalidProof.into());
            }

            // TODO: Verify ZK proof using Bonsol
            // For now, we'll just check that proof exists
            // In production, verify the proof against the vault's public inputs
        }

        // Check MPC sharing
        if vault.has_mpc_sharing() {
            // TODO: Verify MPC share using Arcium
            // For now, return unauthorized if not owner
            return Err(HideAwayError::Unauthorized.into());
        }

        // Check Lit conditions
        if vault.has_lit_conditions() {
            // TODO: Verify Lit Protocol conditions
            // For now, return unauthorized if not owner
            return Err(HideAwayError::Unauthorized.into());
        }

        // If no special access control, unauthorized
        return Err(HideAwayError::Unauthorized.into());
    }

    // Check time lock
    // TODO: Get current timestamp from Clock sysvar
    let current_timestamp = 0i64;
    if !vault.is_time_lock_expired(current_timestamp) {
        return Err(HideAwayError::TimeLockNotExpired.into());
    }

    // Access granted - file vault can be read by client
    Ok(())
}
