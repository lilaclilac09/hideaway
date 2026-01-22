/**
 * HideAway Client SDK
 * 
 * TypeScript client for interacting with the HideAway Solana program.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

export const HIDEAWAY_PROGRAM_ID = new PublicKey("11111111111111111111111111111111"); // Replace with actual program ID

export const FILE_VAULT_DISCRIMINATOR = "hideaway";

export interface FileVaultData {
  discriminator: string;
  bump: number;
  owner: PublicKey;
  fileHash: Uint8Array;
  salt: Uint8Array;
  encryptedCid: string;
  cidLength: number;
  uploadedAt: number;
  timeLockExpiry: number;
  mpcShareCount: number;
  accessFlags: number;
}

/**
 * Derive FileVault PDA address
 */
export async function deriveFileVaultAddress(
  programId: PublicKey,
  owner: PublicKey,
  fileHash: Uint8Array
): Promise<[PublicKey, number]> {
  const seeds = [
    Buffer.from("file_vault"),
    owner.toBuffer(),
    fileHash,
  ];

  return PublicKey.findProgramAddress(seeds, programId);
}

/**
 * Create upload file instruction
 */
export async function createUploadFileInstruction(
  programId: PublicKey,
  owner: PublicKey,
  fileHash: Uint8Array,
  salt: Uint8Array,
  encryptedCid: string
): Promise<[Transaction, PublicKey]> {
  const [fileVault, bump] = await deriveFileVaultAddress(programId, owner, fileHash);

  const cidBytes = Buffer.from(encryptedCid, "utf-8");
  if (cidBytes.length > 128) {
    throw new Error("CID too long (max 128 bytes)");
  }

  const instructionData = Buffer.concat([
    Buffer.from([0]), // UploadFile discriminator
    Buffer.from(fileHash),
    Buffer.from(salt),
    Buffer.from([cidBytes.length]),
    cidBytes,
  ]);

  const instruction = {
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: fileVault, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data: instructionData,
  };

  const transaction = new Transaction().add(instruction);

  return [transaction, fileVault];
}

/**
 * Create access file instruction
 */
export async function createAccessFileInstruction(
  programId: PublicKey,
  accessor: PublicKey,
  fileVault: PublicKey,
  fileHash: Uint8Array,
  zkProof?: Uint8Array
): Promise<Transaction> {
  let instructionData = Buffer.concat([
    Buffer.from([1]), // AccessFile discriminator
    Buffer.from(fileHash),
  ]);

  if (zkProof) {
    instructionData = Buffer.concat([
      instructionData,
      Buffer.from([zkProof.length]),
      Buffer.from(zkProof),
    ]);
  } else {
    instructionData = Buffer.concat([instructionData, Buffer.from([0])]);
  }

  const instruction = {
    keys: [
      { pubkey: accessor, isSigner: true, isWritable: false },
      { pubkey: fileVault, isSigner: false, isWritable: false },
    ],
    programId,
    data: instructionData,
  };

  return new Transaction().add(instruction);
}

/**
 * Create share file instruction
 */
export async function createShareFileInstruction(
  programId: PublicKey,
  owner: PublicKey,
  fileVault: PublicKey,
  shareType: "mpc" | "timelock" | "lit",
  options: {
    mpcShareCount?: number;
    timeLockExpiry?: number;
    accessFlags?: number;
  }
): Promise<Transaction> {
  let instructionData: Buffer;

  switch (shareType) {
    case "mpc":
      if (!options.mpcShareCount) {
        throw new Error("mpcShareCount required for MPC sharing");
      }
      instructionData = Buffer.concat([
        Buffer.from([2]), // ShareFile discriminator
        Buffer.from([0]), // Share type: MPC
        Buffer.from([options.mpcShareCount]),
      ]);
      break;
    case "timelock":
      if (!options.timeLockExpiry) {
        throw new Error("timeLockExpiry required for time lock");
      }
      const timeLockBuffer = Buffer.allocUnsafe(8);
      timeLockBuffer.writeBigInt64LE(BigInt(options.timeLockExpiry), 0);
      instructionData = Buffer.concat([
        Buffer.from([2]), // ShareFile discriminator
        Buffer.from([1]), // Share type: TimeLock
        timeLockBuffer,
      ]);
      break;
    case "lit":
      instructionData = Buffer.concat([
        Buffer.from([2]), // ShareFile discriminator
        Buffer.from([2]), // Share type: LitCondition
        Buffer.from([options.accessFlags || 0]),
      ]);
      break;
  }

  const instruction = {
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: fileVault, isSigner: false, isWritable: true },
    ],
    programId,
    data: instructionData,
  };

  return new Transaction().add(instruction);
}

/**
 * Decode FileVault account data
 */
export function decodeFileVault(data: Buffer): FileVaultData {
  if (data.length < 323) {
    throw new Error("Invalid FileVault data length");
  }

  let offset = 0;

  // discriminator (8 bytes)
  const discriminator = data.slice(offset, offset + 8).toString("utf-8");
  offset += 8;

  // bump (1 byte)
  const bump = data[offset];
  offset += 1;

  // owner (32 bytes)
  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // file_hash (32 bytes)
  const fileHash = new Uint8Array(data.slice(offset, offset + 32));
  offset += 32;

  // salt (32 bytes)
  const salt = new Uint8Array(data.slice(offset, offset + 32));
  offset += 32;

  // encrypted_cid (128 bytes)
  const cidLength = data[offset + 128];
  const encryptedCid = data.slice(offset, offset + cidLength).toString("utf-8");
  offset += 128 + 1;

  // uploaded_at (8 bytes)
  const uploadedAt = Number(data.readBigInt64LE(offset));
  offset += 8;

  // time_lock_expiry (8 bytes)
  const timeLockExpiry = Number(data.readBigInt64LE(offset));
  offset += 8;

  // mpc_share_count (1 byte)
  const mpcShareCount = data[offset];
  offset += 1;

  // access_flags (1 byte)
  const accessFlags = data[offset];

  return {
    discriminator,
    bump,
    owner,
    fileHash,
    salt,
    encryptedCid,
    cidLength,
    uploadedAt,
    timeLockExpiry,
    mpcShareCount,
    accessFlags,
  };
}

/**
 * Upload a file to HideAway
 */
export async function uploadFile(
  connection: Connection,
  payer: Keypair,
  fileHash: Uint8Array,
  salt: Uint8Array,
  encryptedCid: string
): Promise<PublicKey> {
  const [transaction, fileVault] = await createUploadFileInstruction(
    HIDEAWAY_PROGRAM_ID,
    payer.publicKey,
    fileHash,
    salt,
    encryptedCid
  );

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = payer.publicKey;

  await sendAndConfirmTransaction(connection, transaction, [payer]);

  return fileVault;
}

/**
 * Access a file from HideAway
 */
export async function accessFile(
  connection: Connection,
  accessor: Keypair,
  fileVault: PublicKey,
  fileHash: Uint8Array,
  zkProof?: Uint8Array
): Promise<void> {
  const transaction = await createAccessFileInstruction(
    HIDEAWAY_PROGRAM_ID,
    accessor.publicKey,
    fileVault,
    fileHash,
    zkProof
  );

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = accessor.publicKey;

  await sendAndConfirmTransaction(connection, transaction, [accessor]);
}

/**
 * Get FileVault account data
 */
export async function getFileVault(
  connection: Connection,
  fileVault: PublicKey
): Promise<FileVaultData | null> {
  const accountInfo = await connection.getAccountInfo(fileVault);
  if (!accountInfo) {
    return null;
  }

  return decodeFileVault(accountInfo.data);
}
