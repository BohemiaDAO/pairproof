/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pairproof.json`.
 */
export type Pairproof = {
  "address": "6XxZ4hSsYVp4c1VrTEo1RbAEhpoHxpCFT1yjUWH5Xias",
  "metadata": {
    "name": "pairproof",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelProposal",
      "docs": [
        "The proposer withdraws an open proposal and reclaims rent."
      ],
      "discriminator": [
        106,
        74,
        128,
        146,
        19,
        65,
        39,
        23
      ],
      "accounts": [
        {
          "name": "proposer",
          "docs": [
            "Only the original proposer may cancel; receives the rent back."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.a",
                "account": "proposal"
              },
              {
                "kind": "account",
                "path": "proposal.b",
                "account": "proposal"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "confirm",
      "docs": [
        "The counterparty accepts: creates the attestation and closes the proposal."
      ],
      "discriminator": [
        174,
        1,
        15,
        213,
        3,
        190,
        131,
        0
      ],
      "accounts": [
        {
          "name": "confirmer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "docs": [
            "Address is re-derived from the stored (sorted) pair, and the proposal is closed so",
            "it cannot be replayed. Rent goes to the confirmer (see struct docs)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal.a",
                "account": "proposal"
              },
              {
                "kind": "account",
                "path": "proposal.b",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "attestation",
          "docs": [
            "`init` fails if an attestation for this pair already exists."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal.a",
                "account": "proposal"
              },
              {
                "kind": "account",
                "path": "proposal.b",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "propose",
      "docs": [
        "Open a request to connect with `counterparty`. Signer pays rent."
      ],
      "discriminator": [
        93,
        253,
        82,
        168,
        118,
        33,
        102,
        90
      ],
      "accounts": [
        {
          "name": "proposer",
          "docs": [
            "Signs and pays rent for the proposal."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "docs": [
            "an empty system account. Created manually in the handler."
          ],
          "writable": true
        },
        {
          "name": "attestation",
          "docs": [
            "empty system account, i.e. no attestation exists (never created, or revoked)."
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "counterparty",
          "type": "pubkey"
        },
        {
          "name": "method",
          "type": "u8"
        },
        {
          "name": "contextHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "expiresAt",
          "type": "i64"
        }
      ]
    },
    {
      "name": "revoke",
      "docs": [
        "Either party deletes the attestation; rent returns to the stored payer."
      ],
      "discriminator": [
        170,
        23,
        31,
        34,
        133,
        173,
        93,
        242
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "Either party of the attestation. Checked in the attestation constraint below."
          ],
          "signer": true
        },
        {
          "name": "attestation",
          "docs": [
            "Rent goes to the stored `payer` (`has_one`), never to an address chosen by the caller."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  103,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "attestation.a",
                "account": "attestation"
              },
              {
                "kind": "account",
                "path": "attestation.b",
                "account": "attestation"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "relations": [
            "attestation"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "attestation",
      "discriminator": [
        152,
        125,
        183,
        86,
        36,
        146,
        121,
        73
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    }
  ],
  "events": [
    {
      "name": "attestationCreated",
      "discriminator": [
        217,
        170,
        19,
        203,
        128,
        51,
        29,
        163
      ]
    },
    {
      "name": "attestationRevoked",
      "discriminator": [
        47,
        106,
        65,
        238,
        200,
        127,
        163,
        50
      ]
    },
    {
      "name": "proposalCancelled",
      "discriminator": [
        253,
        59,
        104,
        46,
        129,
        78,
        9,
        14
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "selfAttestation",
      "msg": "You cannot attest a connection with yourself"
    },
    {
      "code": 6001,
      "name": "invalidMethod",
      "msg": "Unknown method code (expected 0 = in person, 1 = video call, 2 = vouch)"
    },
    {
      "code": 6002,
      "name": "expiryInPast",
      "msg": "Expiry must be in the future"
    },
    {
      "code": 6003,
      "name": "proposalExpired",
      "msg": "This proposal has expired"
    },
    {
      "code": 6004,
      "name": "attestationAlreadyExists",
      "msg": "A connection between these two wallets already exists"
    },
    {
      "code": 6005,
      "name": "proposalAlreadyExists",
      "msg": "A proposal between these two wallets is already open"
    },
    {
      "code": 6006,
      "name": "invalidPda",
      "msg": "Account address does not match the canonical sorted-pair PDA"
    },
    {
      "code": 6007,
      "name": "invalidConfirmer",
      "msg": "Only the other party of the proposal can confirm it"
    },
    {
      "code": 6008,
      "name": "notProposer",
      "msg": "Only the proposer can cancel this proposal"
    },
    {
      "code": 6009,
      "name": "notParty",
      "msg": "Only one of the two connected wallets can revoke this connection"
    }
  ],
  "types": [
    {
      "name": "attestation",
      "docs": [
        "A confirmed, mutual connection. PDA seeds: `[\"edge\", a, b]` with `a < b`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "method",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "contextHash",
            "docs": [
              "All zeros = no context."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "payer",
            "docs": [
              "Wallet that economically funded the rent; receives it back on revoke."
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "attestationCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "method",
            "type": "u8"
          },
          {
            "name": "contextHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "attestationRevoked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "docs": [
        "A pending, one-sided request. PDA seeds: `[\"proposal\", a, b]` with `a < b`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "method",
            "type": "u8"
          },
          {
            "name": "contextHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "pubkey"
          },
          {
            "name": "b",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "method",
            "type": "u8"
          },
          {
            "name": "contextHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expiresAt",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "edgeSeed",
      "docs": [
        "PDA seed prefix for `Attestation` accounts."
      ],
      "type": "bytes",
      "value": "[101, 100, 103, 101]"
    },
    {
      "name": "proposalSeed",
      "docs": [
        "PDA seed prefix for `Proposal` accounts."
      ],
      "type": "bytes",
      "value": "[112, 114, 111, 112, 111, 115, 97, 108]"
    }
  ]
};
