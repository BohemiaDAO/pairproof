
export const PairproofErrorCode = {
  SelfAttestation: 6000,
  InvalidMethod: 6001,
  ExpiryInPast: 6002,
  ProposalExpired: 6003,
  AttestationAlreadyExists: 6004,
  ProposalAlreadyExists: 6005,
  InvalidPda: 6006,
  InvalidConfirmer: 6007,
  NotProposer: 6008,
  NotParty: 6009
};

export type PairproofErrorName = keyof typeof PairproofErrorCode;
