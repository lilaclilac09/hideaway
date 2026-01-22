//! On-chain Account State
//!
//! Defines the FileVault account structure for HideAway.
//! Stores file hash commitments and metadata on-chain.

use pinocchio::pubkey::Pubkey;

/// FileVault account discriminator (8 bytes)
pub const FILE_VAULT_DISCRIMINATOR: [u8; 8] = *b"hideaway";

/// Maximum IPFS CID length (128 bytes for base58 encoded CID)
pub const MAX_CID_LENGTH: usize = 128;

/// SHA-256 hash length (32 bytes)
pub const HASH_LENGTH: usize = 32;

/// FileVault account storing file metadata and hash commitment
///
/// Total size: ~300 bytes
#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct FileVault {
    /// Account discriminator for type identification (8 bytes)
    pub discriminator: [u8; 8],

    /// PDA bump seed for address derivation (1 byte)
    pub bump: u8,

    /// File owner (32 bytes)
    pub owner: Pubkey,

    /// SHA-256 hash of the file (32 bytes)
    pub file_hash: [u8; HASH_LENGTH],

    /// Salt used for hashing (32 bytes) - prevents rainbow table attacks
    pub salt: [u8; HASH_LENGTH],

    /// Encrypted IPFS CID (up to 128 bytes, null-padded)
    pub encrypted_cid: [u8; MAX_CID_LENGTH],

    /// Actual CID length (1 byte)
    pub cid_length: u8,

    /// Timestamp when file was uploaded (8 bytes)
    pub uploaded_at: i64,

    /// Time lock expiration timestamp (8 bytes, 0 = no time lock)
    pub time_lock_expiry: i64,

    /// MPC share count for multi-party access (1 byte)
    pub mpc_share_count: u8,

    /// Access control flags (1 byte)
    /// bit 0: ZK proof required
    /// bit 1: MPC sharing enabled
    /// bit 2: Lit conditions enabled
    pub access_flags: u8,

    /// Reserved padding for future use (71 bytes)
    pub _padding: [u8; 71],
}

impl FileVault {
    /// Total size of FileVault account in bytes
    /// 8 + 1 + 32 + 32 + 32 + 128 + 1 + 8 + 8 + 1 + 1 + 71 = 323 bytes
    pub const SIZE: usize = 8      // discriminator
        + 1                         // bump
        + 32                        // owner
        + HASH_LENGTH               // file_hash (32)
        + HASH_LENGTH               // salt (32)
        + MAX_CID_LENGTH            // encrypted_cid (128)
        + 1                         // cid_length
        + 8                         // uploaded_at
        + 8                         // time_lock_expiry
        + 1                         // mpc_share_count
        + 1                         // access_flags
        + 71;                       // padding

    /// Create a new FileVault with default values
    pub fn new(
        bump: u8,
        owner: Pubkey,
        file_hash: [u8; HASH_LENGTH],
        salt: [u8; HASH_LENGTH],
        encrypted_cid: &[u8],
        uploaded_at: i64,
    ) -> Result<Self, &'static str> {
        if encrypted_cid.len() > MAX_CID_LENGTH {
            return Err("CID too long");
        }

        let mut cid_bytes = [0u8; MAX_CID_LENGTH];
        cid_bytes[..encrypted_cid.len()].copy_from_slice(encrypted_cid);

        Ok(Self {
            discriminator: FILE_VAULT_DISCRIMINATOR,
            bump,
            owner,
            file_hash,
            salt,
            encrypted_cid: cid_bytes,
            cid_length: encrypted_cid.len() as u8,
            uploaded_at,
            time_lock_expiry: 0,
            mpc_share_count: 0,
            access_flags: 0,
            _padding: [0; 71],
        })
    }

    /// Check if the discriminator is valid
    #[inline]
    pub fn is_valid_discriminator(&self) -> bool {
        self.discriminator == FILE_VAULT_DISCRIMINATOR
    }

    /// Check if time lock has expired
    #[inline]
    pub fn is_time_lock_expired(&self, current_timestamp: i64) -> bool {
        self.time_lock_expiry == 0 || current_timestamp >= self.time_lock_expiry
    }

    /// Check if ZK proof is required
    #[inline]
    pub fn requires_zk_proof(&self) -> bool {
        self.access_flags & 0x01 != 0
    }

    /// Check if MPC sharing is enabled
    #[inline]
    pub fn has_mpc_sharing(&self) -> bool {
        self.access_flags & 0x02 != 0
    }

    /// Check if Lit conditions are enabled
    #[inline]
    pub fn has_lit_conditions(&self) -> bool {
        self.access_flags & 0x04 != 0
    }

    /// Get the actual CID bytes (without padding)
    pub fn get_cid(&self) -> &[u8] {
        &self.encrypted_cid[..self.cid_length as usize]
    }

    /// Serialize FileVault to bytes
    pub fn to_bytes(&self) -> [u8; Self::SIZE] {
        let mut bytes = [0u8; Self::SIZE];
        let mut offset = 0;

        // discriminator
        bytes[offset..offset + 8].copy_from_slice(&self.discriminator);
        offset += 8;

        // bump
        bytes[offset] = self.bump;
        offset += 1;

        // owner
        bytes[offset..offset + 32].copy_from_slice(self.owner.as_ref());
        offset += 32;

        // file_hash
        bytes[offset..offset + HASH_LENGTH].copy_from_slice(&self.file_hash);
        offset += HASH_LENGTH;

        // salt
        bytes[offset..offset + HASH_LENGTH].copy_from_slice(&self.salt);
        offset += HASH_LENGTH;

        // encrypted_cid
        bytes[offset..offset + MAX_CID_LENGTH].copy_from_slice(&self.encrypted_cid);
        offset += MAX_CID_LENGTH;

        // cid_length
        bytes[offset] = self.cid_length;
        offset += 1;

        // uploaded_at
        bytes[offset..offset + 8].copy_from_slice(&self.uploaded_at.to_le_bytes());
        offset += 8;

        // time_lock_expiry
        bytes[offset..offset + 8].copy_from_slice(&self.time_lock_expiry.to_le_bytes());
        offset += 8;

        // mpc_share_count
        bytes[offset] = self.mpc_share_count;
        offset += 1;

        // access_flags
        bytes[offset] = self.access_flags;
        offset += 1;

        // padding
        bytes[offset..offset + 71].copy_from_slice(&self._padding);

        bytes
    }

    /// Deserialize FileVault from bytes
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        if bytes.len() < Self::SIZE {
            return None;
        }

        let mut offset = 0;

        // discriminator
        let mut discriminator = [0u8; 8];
        discriminator.copy_from_slice(&bytes[offset..offset + 8]);
        offset += 8;

        // bump
        let bump = bytes[offset];
        offset += 1;

        // owner
        let owner: Pubkey = bytes[offset..offset + 32].try_into().ok()?;
        offset += 32;

        // file_hash
        let mut file_hash = [0u8; HASH_LENGTH];
        file_hash.copy_from_slice(&bytes[offset..offset + HASH_LENGTH]);
        offset += HASH_LENGTH;

        // salt
        let mut salt = [0u8; HASH_LENGTH];
        salt.copy_from_slice(&bytes[offset..offset + HASH_LENGTH]);
        offset += HASH_LENGTH;

        // encrypted_cid
        let mut encrypted_cid = [0u8; MAX_CID_LENGTH];
        encrypted_cid.copy_from_slice(&bytes[offset..offset + MAX_CID_LENGTH]);
        offset += MAX_CID_LENGTH;

        // cid_length
        let cid_length = bytes[offset];
        offset += 1;

        // uploaded_at
        let uploaded_at = i64::from_le_bytes(bytes[offset..offset + 8].try_into().ok()?);
        offset += 8;

        // time_lock_expiry
        let time_lock_expiry = i64::from_le_bytes(bytes[offset..offset + 8].try_into().ok()?);
        offset += 8;

        // mpc_share_count
        let mpc_share_count = bytes[offset];
        offset += 1;

        // access_flags
        let access_flags = bytes[offset];
        offset += 1;

        // padding
        let mut _padding = [0u8; 71];
        _padding.copy_from_slice(&bytes[offset..offset + 71]);

        Some(Self {
            discriminator,
            bump,
            owner,
            file_hash,
            salt,
            encrypted_cid,
            cid_length,
            uploaded_at,
            time_lock_expiry,
            mpc_share_count,
            access_flags,
            _padding,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_vault_size() {
        assert_eq!(FileVault::SIZE, 323);
    }

    #[test]
    fn test_file_vault_serialization_roundtrip() {
        let zero_pubkey: Pubkey = [0u8; 32];
        let file_hash = [1u8; HASH_LENGTH];
        let salt = [2u8; HASH_LENGTH];
        let cid = b"QmTest123456789";

        let vault = FileVault::new(255, zero_pubkey, file_hash, salt, cid, 1234567890).unwrap();

        let bytes = vault.to_bytes();
        let deserialized = FileVault::from_bytes(&bytes).unwrap();

        assert_eq!(vault.discriminator, deserialized.discriminator);
        assert_eq!(vault.bump, deserialized.bump);
        assert_eq!(vault.file_hash, deserialized.file_hash);
        assert_eq!(vault.salt, deserialized.salt);
        assert_eq!(vault.get_cid(), deserialized.get_cid());
        assert_eq!(vault.uploaded_at, deserialized.uploaded_at);
    }

    #[test]
    fn test_time_lock_expiry() {
        let zero_pubkey: Pubkey = [0u8; 32];
        let vault = FileVault::new(
            255,
            zero_pubkey,
            [0u8; HASH_LENGTH],
            [0u8; HASH_LENGTH],
            b"test",
            1000,
        )
        .unwrap();

        assert!(vault.is_time_lock_expired(2000)); // No time lock set

        // Would need to set time_lock_expiry in a real test
    }
}
