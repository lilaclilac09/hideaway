//! Instruction Handlers
//!
//! Defines instruction types and routes to handlers.

pub mod access_file;
pub mod share_file;
pub mod upload_file;

/// Instruction discriminator enum
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Instruction {
    /// Upload a file (hash + encrypted CID)
    UploadFile = 0,

    /// Access a file (verify hash + optional ZK proof)
    AccessFile = 1,

    /// Share a file (MPC sharing setup)
    ShareFile = 2,
}

impl Instruction {
    /// Try to convert u8 to Instruction
    pub fn try_from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(Instruction::UploadFile),
            1 => Some(Instruction::AccessFile),
            2 => Some(Instruction::ShareFile),
            _ => None,
        }
    }
}
