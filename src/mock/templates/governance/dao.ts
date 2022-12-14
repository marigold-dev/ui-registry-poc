import { Template } from "../../types";

const daoCameligo: Template = {
  name: "DAO-Cameligo",
  category: "governance",
  repository: "https://github.com/ligolang/dao-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of DAO contract in CameLIGO",
  readme: `# DAO-cameligo

A modular example DAO contract on Tezos written in Ligolang.

## Intro

This example DAO allows FA2 token holders to vote on proposals, which trigger
on-chain changes when accepted.
It is using **token based quorum voting**, requiring a given threshold of
participating tokens for a proposal to pass.
The contract code uses Ligo [modules](https://ligolang.org/docs/language-basics/modules/),
and the [tezos-ligo-fa2](https://www.npmjs.com/package/tezos-ligo-fa2)
[package](https://ligolang.org/docs/advanced/package-management).

The used \`FA2\` token is expected to extend [the TZIP-12 standard](https://tzip.tezosagora.org/proposal/tzip-12/)
with an on-chain view \`total_supply\` returning the total supply of tokens. This
number, of type \`nat\` is then used as base for the participation computation,
see [example \`FA2\` in the test directory](./test/bootstrap/single_asset.mligo).

## Requirements

The contract is written in \`cameligo\` flavour of [LigoLANG](https://ligolang.org/),
to be able to compile the contract, you need either:

- a [ligo binary](https://ligolang.org/docs/intro/installation#static-linux-binary),
  in this case, to use the binary, you need to have set up a \`LIGO\` environment variable,
  pointing to the binary (see [Makefile](./Makefile))
- or [docker](https://docs.docker.com/engine/install/)

For deploy scripts, you also need to have [nodejs](https://nodejs.org/en/) installed,
up to version 14 and docker if you wish to deploy on a sandbox.

## Usage

1. Run \`make install\` to install dependencies
2. Run \`make\` to see available commands
3. You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

## Documentation

See [Documentation](./docs/00-index.md)

## Follow-Up

- Expand vote: add third "Pass" choice, add [Score Voting](https://en.wikipedia.org/wiki/Score_voting)
- Vote incentives with some staking mechanism
- Mutation tests
- Optimizations (inline...)
- Attack tests (see last one: <https://twitter.com/ylv_io/status/1515773148465147926>)
`,
  mainFile: `#import "./constants.mligo" "Constants"
#import "./errors.mligo" "Errors"
#import "./lambda.mligo" "Lambda"
#import "./outcome.mligo" "Outcome"
#import "./proposal.mligo" "Proposal"
#import "./storage.mligo" "Storage"
#import "./vote.mligo" "Vote"
#import "./token.mligo" "Token"
#import "./vault.mligo" "Vault"
#import "./timelock.mligo" "Timelock"

type parameter =
    [@layout:comb]
    | Propose of Proposal.make_params
    | Cancel of nat option
    | Lock of Vault.amount_
    | Release of Vault.amount_
    | Execute of Outcome.execute_params
    | Vote of Vote.choice
    | End_vote

type storage = Storage.t
type result = operation list * storage

let execute (outcome_key, packed, s: nat * bytes * storage) : result =
    let proposal = (match Big_map.find_opt outcome_key s.outcomes with
        None -> failwith Errors.outcome_not_found
        | Some(o) -> Outcome.get_executable_proposal(o)) in

    let () = Timelock._check_unlocked(proposal.timelock) in
    let lambda_ = Lambda.unpack(proposal.hash, packed) in

    match lambda_ with
        OperationList f ->
            f(),
            Storage.update_outcome(outcome_key, (proposal, Executed), s)
        | ParameterChange f ->
            Constants.no_operation,
            Storage.update_outcome(
                outcome_key,
                (proposal, Executed),
                Storage.update_config(f,s)
            )

let propose (p, s : Proposal.make_params * storage) : result =
    match s.proposal with
        Some(_) -> failwith Errors.proposal_already_exists
        | None -> [
            Token.transfer(
                s.governance_token,
                Tezos.get_sender(),
                Tezos.get_self_address(),
                s.config.deposit_amount
        )], Storage.create_proposal(
                Proposal.make(p, s.config.start_delay, s.config.voting_period),
                s)

let cancel (outcome_key_opt, s : nat option * storage) : result =
   [Token.transfer(
        s.governance_token,
        Tezos.get_self_address(),
        s.config.burn_address,
        s.config.deposit_amount)
   ], (match outcome_key_opt with
        None -> (match s.proposal with
            None -> failwith Errors.nothing_to_cancel
            | Some(p) -> let () = Proposal._check_not_voting_period(p) in
                let _check_sender_is_creator = assert_with_error
                    (p.creator = Tezos.get_sender())
                    Errors.not_creator in
                Storage.add_outcome((p, Canceled), s))
        | Some(outcome_key) -> (match Big_map.find_opt outcome_key s.outcomes with
            None -> failwith Errors.outcome_not_found
            | Some(o) -> let (p, state) = o in
            let _check_sender_is_creator = assert_with_error
                (p.creator = Tezos.get_sender())
                Errors.not_creator in
            let _check_not_executed = assert_with_error
                (state <> (Executed : Outcome.state))
                Errors.already_executed in
            let () = Timelock._check_locked(p.timelock) in
            Storage.update_outcome(outcome_key, (p, Canceled), s)))

let lock (amount_, s : nat * storage) : result =
    let () = Proposal._check_no_vote_ongoing(s.proposal) in
    let current_amount = Vault.get_for_user(s.vault, Tezos.get_sender()) in

    [Token.transfer(
        s.governance_token,
        Tezos.get_sender(),
        Tezos.get_self_address(), amount_)
    ], Storage.update_vault(Vault.update_for_user(
        s.vault,
        Tezos.get_sender(),
        current_amount + amount_), s)

let release (amount_, s : nat * storage) : result =
    let () = Proposal._check_no_vote_ongoing(s.proposal) in
    let current_amount = Vault.get_for_user_exn(s.vault, Tezos.get_sender()) in
    let _check_balance = assert_with_error
        (current_amount >= amount_)
        Errors.not_enough_balance in

    [Token.transfer(s.governance_token, Tezos.get_self_address(), Tezos.get_sender(), amount_)],
    Storage.update_vault(Vault.update_for_user(
        s.vault,
        Tezos.get_sender(),
        abs(current_amount - amount_)), s)

let vote (choice, s : bool * storage) : storage =
    match s.proposal with
        None -> failwith Errors.no_proposal
        | Some(p) -> let () = Proposal._check_is_voting_period(p) in
            let amount_ = Vault.get_for_user_exn(s.vault, Tezos.get_sender()) in
            Storage.update_votes(p, (choice, amount_), s)

let end_vote (s : storage) : result =
    match s.proposal with
        None -> failwith Errors.no_proposal
        | Some(p) -> let () = Proposal._check_voting_period_ended(p) in
            let total_supply = (match Token.get_total_supply(s.governance_token) with
                None -> failwith Errors.fa2_total_supply_not_found
                | Some n -> n) in
            let outcome = Outcome.make(
                    p,
                    total_supply,
                    s.config.refund_threshold,
                    s.config.quorum_threshold,
                    s.config.super_majority
                ) in
            let (_, state) = outcome in
            let transfer_to_addr = match state with
                Rejected_(WithoutRefund) -> s.config.burn_address
                | _ -> p.creator
            in
            ([Token.transfer(
                s.governance_token,
                Tezos.get_self_address(),
                transfer_to_addr,
                s.config.deposit_amount)]
            ), Storage.add_outcome(outcome, s)

let main (action, store : parameter * storage) : result =
    let _check_amount_is_zero = assert_with_error
        (Tezos.get_amount() = 0tez)
        Errors.not_zero_amount
    in match action with
        Propose p -> propose(p, store)
        | Cancel n_opt -> cancel(n_opt, store)
        | Lock n -> lock(n, store)
        | Release n -> release(n, store)
        | Execute p -> execute(p.outcome_key, p.packed, store)
        | Vote v -> Constants.no_operation, vote(v, store)
        | End_vote -> end_vote(store)
`,
  michelson: [],
};

const daoJsligo: Template = {
  name: "DAO-JsLIGO",
  category: "governance",
  repository: "https://github.com/ligolang/dao-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of DAO contract in JsLIGO",
  readme: `# DAO-jsligo

A modular example DAO contract on Tezos written in Ligolang.

## Intro

This example DAO allows FA2 token holders to vote on proposals, which trigger
on-chain changes when accepted.
It is using **token based quorum voting**, requiring a given threshold of
participating tokens for a proposal to pass.
The contract code uses Ligo [modules](https://ligolang.org/docs/language-basics/modules/),
and the [tezos-ligo-fa2](https://www.npmjs.com/package/tezos-ligo-fa2)
[package](https://ligolang.org/docs/advanced/package-management).

The used \`FA2\` token is expected to extend [the TZIP-12 standard](https://tzip.tezosagora.org/proposal/tzip-12/)
with an on-chain view \`total_supply\` returning the total supply of tokens. This
number, of type \`nat\` is then used as base for the participation computation,
see [example \`FA2\` in the test directory](./test/bootstrap/single_asset.jsligo).

## Requirements

The contract is written in \`jsligo\` flavour of [LigoLANG](https://ligolang.org/),
to be able to compile the contract, you need either:

- a [ligo binary](https://ligolang.org/docs/intro/installation#static-linux-binary),
  in this case, to use the binary, you need to have set up a \`LIGO\` environment variable,
  pointing to the binary (see [Makefile](./Makefile))
- or [docker](https://docs.docker.com/engine/install/)

For deploy scripts, you also need to have [nodejs](https://nodejs.org/en/) installed,
up to version 14 and docker if you wish to deploy on a sandbox.

## Usage

1. Run \`make install\` to install dependencies
2. Run \`make\` to see available commands
3. You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compile=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

## Documentation

See [Documentation](./docs/00-index.md)

## Follow-Up

- Expand vote: add third "Pass" choice, add [Score Voting](https://en.wikipedia.org/wiki/Score_voting)
- Vote incentives with some staking mechanism
- Mutation tests
- Optimizations (inline...)
- Attack tests (see last one: <https://twitter.com/ylv_io/status/1515773148465147926>)
`,
  mainFile: `#import "./constants.jsligo" "Constants"
#import "./errors.jsligo" "Errors"
#import "./lambda.jsligo" "Lambda"
#import "./outcome.jsligo" "Outcome"
#import "./proposal.jsligo" "Proposal"
#import "./storage.jsligo" "Storage"
#import "./vote.jsligo" "Vote"
#import "./token.jsligo" "Token"
#import "./vault.jsligo" "Vault"
#import "./timelock.jsligo" "Timelock"

export type parameter =
    // @layout:comb
    | ["Propose", Proposal.makeParams]
    | ["Cancel", option<nat>]
    | ["Lock", Vault.amount_]
    | ["Release", Vault.amount_]
    | ["Execute", Outcome.executeParams]
    | ["Vote", Vote.choice]
    | ["EndVote"]
;

export type storage = Storage.t;
type result = [list<operation>, storage];

const execute = (outcomeKey: nat, packed: bytes, s: storage) : result => {
    const proposal = match(Big_map.find_opt(outcomeKey, s.outcomes), {
        None: () => failwith(Errors.outcomeNotFound),
        Some: (o: Outcome.t) => Outcome.getExecutableProposal(o)
    });

    Timelock._checkUnlocked(proposal.timelock);
    const lambda_ : Lambda.t = Lambda.unpack(proposal.hash, packed);

    return match(lambda_, {
        OperationList: (f: Lambda.operationList) => [
            f(),
            Storage.updateOutcome(outcomeKey, [proposal, Executed()], s)
        ],
        ParameterChange: (f: Lambda.parameterChange) => [
            Constants.noOperation,
            Storage.updateOutcome(
                outcomeKey,
                [proposal, Executed()],
                Storage.updateConfig(f,s)
            )]
    });
};

const propose = (p: Proposal.makeParams, s: storage) : result =>
    match(s.proposal, {
        Some: (_: Proposal.t) => failwith(Errors.proposalAlreadyExists),
        None: () => [
            list([Token.transfer(
                s.governanceToken,
                Tezos.get_sender(),
                Tezos.get_self_address(),
                s.config.depositAmount
            )]), Storage.createProposal(
                Proposal.make(p, s.config.startDelay, s.config.votingPeriod),
                s)
        ]
    });

const cancel = (outcomeKeyOpt: option<nat>, s: storage) : result =>
   [list([Token.transfer(
        s.governanceToken,
        Tezos.get_self_address(),
        s.config.burnAddress,
        s.config.depositAmount)
   ]), match(outcomeKeyOpt, {
        None: () => match(s.proposal, {
            None: () => failwith(Errors.nothingToCancel),
            Some: (p: Proposal.t) => {
                Proposal._checkNotVotingPeriod(p);
                assert_with_error(
                    p.creator == Tezos.get_sender(),
                    Errors.notCreator
                );

                Storage.addOutcome([p, Canceled()], s);
            }}),
        Some: (outcomeKey: nat) => match(Big_map.find_opt(outcomeKey, s.outcomes), {
            None: () => failwith(Errors.outcomeNotFound),
            Some: (o: Outcome.t) => {
                const [p, state] = o;
                assert_with_error(
                    p.creator == Tezos.get_sender(),
                    Errors.notCreator
                );
                assert_with_error(
                    state != (Executed() as Outcome.state),
                    Errors.alreadyExecuted
                );
                Timelock._checkLocked(p.timelock);

                Storage.updateOutcome(outcomeKey, [p, Canceled()], s)
            }})
        })
   ];

const lock = (amount_: nat, s: storage) : result => {
    Proposal._checkNoVoteOngoing(s.proposal);
    const currentAmount = Vault.getForUser(s.vault, Tezos.get_sender());

    return [
        list([Token.transfer(
            s.governanceToken,
            Tezos.get_sender(),
            Tezos.get_self_address(), amount_)]),
        Storage.updateVault(Vault.updateForUser(
            s.vault,
            Tezos.get_sender(),
            currentAmount + amount_), s)
    ];
};

const release = (amount_: nat, s: storage) : result => {
    Proposal._checkNoVoteOngoing(s.proposal);
    const currentAmount = Vault.getForUserExn(s.vault, Tezos.get_sender());
    assert_with_error( (currentAmount >= amount_), Errors.notEnoughBalance);

    return [
        list([Token.transfer(
            s.governanceToken,
            Tezos.get_self_address(),
            Tezos.get_sender(), amount_)]),
        Storage.updateVault(Vault.updateForUser(
            s.vault,
            Tezos.get_sender(),
            abs(currentAmount - amount_)), s)
    ];
};

const vote = (choice: bool, s: storage) : storage =>
    match(s.proposal, {
        None: () => failwith(Errors.noProposal),
        Some: (p: Proposal.t) => {
            Proposal._checkIsVotingPeriod(p);
            const amount_ = Vault.getForUserExn(s.vault, Tezos.get_sender());
            return Storage.updateVotes(p, [choice, amount_], s);
        }});

const endVote = (s: storage) : result =>
    match(s.proposal,{
        None: () => failwith(Errors.noProposal),
        Some: (p: Proposal.t) => {
            Proposal._checkVotingPeriodEnded(p);
            const totalSupply = match(Token.getTotalSupply(s.governanceToken),{
                None: () => failwith(Errors.fa2TotalSupplyNotFound),
                Some: (n: nat) => n
            });
            const outcome = Outcome.make(
                    p,
                    totalSupply,
                    s.config.refundThreshold,
                    s.config.quorumThreshold,
                    s.config.superMajority
                );
            const [_, state] = outcome;

            let transferToAddr = p.creator;
            if (Rejected_(WithoutRefund()) == state) {
                transferToAddr = s.config.burnAddress;
            }
            return [
                list([Token.transfer(
                    s.governanceToken,
                    Tezos.get_self_address(),
                    transferToAddr,
                    s.config.depositAmount)])
                , Storage.addOutcome(outcome, s)
            ];
        }});

const main = (action: parameter, store: storage) : result => {
    assert_with_error(Tezos.get_amount() == (0 as tez), Errors.notZeroAmount);
    return match(action, {
        Propose: (p: Propose.makeParams) => propose(p, store),
        Cancel: (nOpt: option<nat>) => cancel(nOpt, store),
        Lock: (n: nat) => lock(n, store),
        Release: (n: nat) => release(n, store),
        Execute: (p: Outcome.executeParams) => execute(p.outcomeKey, p.packed, store),
        Vote: (v: Vote.choice) => [Constants.noOperation, vote(v, store)],
        EndVote: () => endVote(store)
    });
};
`,
  michelson: [],
};

export default {
  map: {
    [daoCameligo.name]: daoCameligo,
    [daoJsligo.name]: daoJsligo,
  },
  all: [daoCameligo, daoJsligo],
};
