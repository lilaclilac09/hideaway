//! PDA (Program Derived Address) Derivation
//!
//! Defines seeds and derivation functions for program-owned accounts.

use pinocchio::pubkey::{create_program_address, Pubkey};

/// Seed prefix for FileVault PDA
pub const FILE_VAULT_SEED: &[u8] = b"file_vault";

/// Create FileVault PDA with known bump
///
/// Seeds: ["file_vault", owner, file_hash, bump]
pub fn create_file_vault_address_with_bump(
    program_id: &Pubkey,
    owner: &Pubkey,
    file_hash: &[u8; 32],
    bump: u8,
) -> Option<Pubkey> {
    create_program_address(
        &[FILE_VAULT_SEED, owner.as_ref(), file_hash.as_slice(), &[bump]],
        program_id,
    )
    .ok()
}

/// Get seeds for FileVault PDA signing
#[inline]
pub fn file_vault_seeds<'a>(owner: &'a [u8], file_hash: &'a [u8], bump: &'a [u8]) -> [&'a [u8]; 4] {
    [FILE_VAULT_SEED, owner, file_hash, bump]
}
