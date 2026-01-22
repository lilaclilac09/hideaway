//! HideAway - Private File Vault on Solana
//!
//! A decentralized file vault that stores file hashes on-chain for integrity verification,
//! with encrypted files stored off-chain on IPFS. Supports ZK proofs, MPC sharing, and
//! Lit Protocol conditions for conditional access.

#![no_std]

pub mod error;
pub mod instructions;
pub mod pda;
pub mod state;

use instructions::{access_file::process_access_file, share_file::process_share_file, upload_file::process_upload_file, Instruction};
use pinocchio::{
    account_info::AccountInfo,
    default_allocator, nostd_panic_handler, program_entrypoint,
    program_error::ProgramError, pubkey::Pubkey,
    ProgramResult,
};

// For no_std, use individual macros instead of entrypoint!
program_entrypoint!(process_instruction);
default_allocator!();
nostd_panic_handler!();

/// Program entrypoint
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Instruction data must have at least 1 byte for discriminator
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Parse instruction discriminator (first byte)
    let instruction = Instruction::try_from_u8(instruction_data[0])
        .ok_or(ProgramError::InvalidInstructionData)?;

    // Route to instruction handler (skip discriminator byte)
    let data = &instruction_data[1..];

    match instruction {
        Instruction::UploadFile => process_upload_file(program_id, accounts, data),
        Instruction::AccessFile => process_access_file(program_id, accounts, data),
        Instruction::ShareFile => process_share_file(program_id, accounts, data),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_instruction_discriminators() {
        assert_eq!(Instruction::try_from_u8(0), Some(Instruction::UploadFile));
        assert_eq!(Instruction::try_from_u8(1), Some(Instruction::AccessFile));
        assert_eq!(Instruction::try_from_u8(2), Some(Instruction::ShareFile));
        assert_eq!(Instruction::try_from_u8(3), None);
    }
}
