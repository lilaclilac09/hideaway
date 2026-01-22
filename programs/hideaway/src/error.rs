//! Custom Program Errors
//!
//! Defines error types for the HideAway program.

use pinocchio::program_error::ProgramError;

/// Custom error codes for HideAway program
#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum HideAwayError {
    /// Invalid instruction discriminator
    InvalidInstruction = 0,

    /// Invalid account owner
    InvalidOwner = 1,

    /// Invalid PDA derivation
    InvalidPda = 2,

    /// Required signer is missing
    NotSigner = 3,

    /// Account must be writable
    NotWritable = 4,

    /// File hash mismatch - integrity check failed
    HashMismatch = 5,

    /// Invalid file hash length (must be 32 bytes for SHA-256)
    InvalidHashLength = 6,

    /// Invalid IPFS CID length
    InvalidCidLength = 7,

    /// File vault not found
    FileVaultNotFound = 8,

    /// Unauthorized access - user doesn't have permission
    Unauthorized = 9,

    /// Invalid discriminator on account
    InvalidDiscriminator = 10,

    /// Account data too small
    AccountDataTooSmall = 11,

    /// Time lock not yet expired
    TimeLockNotExpired = 12,

    /// Invalid ZK proof
    InvalidProof = 13,

    /// MPC share invalid
    InvalidMpcShare = 14,

    /// File already exists
    FileAlreadyExists = 15,
}

impl From<HideAwayError> for ProgramError {
    fn from(e: HideAwayError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl HideAwayError {
    /// Convert error code to human-readable message
    pub fn message(&self) -> &'static str {
        match self {
            HideAwayError::InvalidInstruction => "Invalid instruction",
            HideAwayError::InvalidOwner => "Invalid account owner",
            HideAwayError::InvalidPda => "Invalid PDA derivation",
            HideAwayError::NotSigner => "Required signer is missing",
            HideAwayError::NotWritable => "Account must be writable",
            HideAwayError::HashMismatch => "File hash mismatch - integrity check failed",
            HideAwayError::InvalidHashLength => "Invalid file hash length (must be 32 bytes)",
            HideAwayError::InvalidCidLength => "Invalid IPFS CID length",
            HideAwayError::FileVaultNotFound => "File vault not found",
            HideAwayError::Unauthorized => "Unauthorized access",
            HideAwayError::InvalidDiscriminator => "Invalid account discriminator",
            HideAwayError::AccountDataTooSmall => "Account data too small",
            HideAwayError::TimeLockNotExpired => "Time lock not yet expired",
            HideAwayError::InvalidProof => "Invalid ZK proof",
            HideAwayError::InvalidMpcShare => "Invalid MPC share",
            HideAwayError::FileAlreadyExists => "File already exists",
        }
    }
}
