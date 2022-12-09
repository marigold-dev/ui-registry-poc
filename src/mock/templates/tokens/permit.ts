import { Template } from "../../types";

const permitCameligo: Template = {
  name: "Permit-Cameligo",
  category: "token",
  repository: "https://github.com/ligolang/permit-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of a permit contract in CameLIGO",
  readme: `# permit-cameligo

This example contract implements an FA2 multi-asset contract with a
[TZIP-17](https://tzip.tezosagora.org/proposal/tzip-17/) extension.

In this implementation, permits can be submitted and consumed in [**separate-steps**](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-17/tzip-17.md#separate-step-permit).

## Why permits?

Permits have 2 main use cases:

- making gasless transaction
- avoiding manipulating operators (FA2) or allowances (FA1.2) when a transaction
must be done by a third party

## Requirements

The contract is written in \`cameligo\` flavour of [LigoLANG](https://ligolang.org/),
to be able to compile the contract, you need either a [ligo binary](https://ligolang.org/docs/intro/installation#static-linux-binary),
or [docker](https://docs.docker.com/engine/install/).

For deploy scripts, you also need to have [nodejs](https://nodejs.org/en/) installed,
up to version 14 and docker if you wish to deploy on a sandbox.

## Usage

1. Run \`make install\` to install dependencies
2. Run \`make\` to see available commands
3. You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> PROTOCOL_OPT="--protocol <PROTOCOL>"
\`\`\`

## Use case: taco shop loyalty program

A potential use case is the digitalization of the good old loyalty card.

### Loyalty Token creation

Expanding on the taco shop tutorial, let's say Pedro creates a new token to
reward his customers.

\`\`\`mermaid
sequenceDiagram
  actor Pedro
  participant FA2
  Note left of Pedro: Pedro create a token
  Pedro->>FA2: Create_token
\`\`\`

### Token distribution

Pedro rewards his customers with one token for each taco bought.

\`\`\`mermaid
sequenceDiagram
  actor Pedro
  participant FA2
  Note left of Pedro: Pedro mint one token to<br> reward tacos buyers
  Pedro->>FA2: Mint_token
\`\`\`

### Permit creation

Alicia is a regular client of the taco shop.
She already accumulated 10 tokens, which can be exchanged for a free taco.
One day, she happens to be out of tez, so she decides to use her tokens to pay.

So, she asks Pedro to create a permit.
The permitted action will be the transfer of 10 tokens from Alicia to Pedro.
Once Pedro has verified the permit parameters given by Alicia, he calls the smart
contract with them, registering the permit.

\`\`\`mermaid
sequenceDiagram
  actor Alicia
  actor Pedro
  participant FA2
  Note left of Alicia: Alicia signs the transfer parameters
  Alicia->>Pedro: send public key, signature, hash
  Note left of Pedro: Pedro registers Alicia request by creating a permit<br> with her public key, signature and hash.
  Pedro->>FA2: Permit(key, (signature, bytes))
\`\`\`

### Permit consumption

The last step consists in Alicia asking Pedro to consume the permit, by revealing
him the parameters she used for the permit creation, allowing Pedro to call the
\`transfer\` entrypoint with these parameters, actually consuming the permit.

\`\`\`mermaid
sequenceDiagram
  actor Alicia
  actor Pedro
  participant FA2
  Note left of Alicia: Alicia reveals the parameters<br> used for the previously created permit.
  Alicia->>Pedro: reveal params
  Note left of Pedro: Pedro calls the transfer entry point for Alicia
  Pedro->>FA2: Transfer
\`\`\`

## Entrypoints

On top of FA2 standard, the following entrypoints are implemented:

- \`permit\`: allows any sender to register a permit.
- \`setExpiry\`: allows any sender to change its expiry configuration for its own permits.
  (intended camel case to comply with tzip-17)
- \`transfer\`: overrides FA2 \`transfer\` to add the handling of permitted parameters.

Additionally, for the use case presentation, 3 entrypoints have been added:

- \`create_token\`: creates a token.
- \`mint_token\`: mint a token.
- \`burn_token\`: burn a token.
- \`set_admin\`: to set the authorized account for the 3 above entry points.

## Smart Contract Data Types

\`\`\` mermaid
classDiagram
    Permit <|-- Storage
    UserExpiry <|-- Storage
    PermitExpiry <|-- Storage

    class Storage {
        defaultExpiry: nat
        counter: nat
    }

    class Permit{
        type t
    }

    class UserExpiry {
        type t
        get(address)
        set(address, nat)
    }

    class PermitExpiry {
        type t
        get(address, bytes)
        set(address, bytes, nat)
    }
\`\`\`

## Resources

- <https://news.ecadlabs.com/understanding-permits-on-tezos-tzip-17-standard-7e470684265c>
- <https://github.com/oxheadalpha/smart-contracts>
`,
  mainFile: `#import "ligo-extendable-fa2/lib/multi_asset/fa2.mligo" "FA2"
#import "./constants.mligo" "Constants"
#import "./storage.mligo" "Storage"
#import "./extension.mligo" "Extension"
#import "./errors.mligo" "Errors"
#import "./token_total_supply.mligo" "TokenTotalSupply"

type token_total_supply = TokenTotalSupply.t
type gen_storage = Storage.t
type storage = token_total_supply gen_storage
type result = operation list * storage
type gen_extension = Extension.t
type extension = token_total_supply gen_extension

type mint_or_burn = [@layout:comb] {
   owner    : address;
   token_id : nat;
   amount_  : nat;
}

type permit_params = (key * (signature * bytes))
type expiry_params = (address * (nat * (bytes option)))

let create (metadata,owner,amount : FA2.TokenMetadata.data * address * nat) (s : storage) =
    let () = Extension.assert_admin s.extension in
    let md = Storage.add_new_token s.token_metadata metadata.token_id metadata in
    let s = Storage.set_token_metadata s md in
    let ledger = FA2.Ledger.increase_token_amount_for_user s.ledger owner metadata.token_id amount in
    let s = FA2.Storage.set_ledger s ledger in
    let supply = TokenTotalSupply.create_supply s.extension.extension metadata.token_id amount in
    Constants.no_operation, {
      s with extension = Extension.set_extension s.extension supply
    }

let mint (lst : mint_or_burn list) (s : storage) =
   let () = Extension.assert_admin s.extension in
   let process_one ((ledger,supply), {owner;token_id;amount_} : (FA2.Ledger.t * TokenTotalSupply.t) * mint_or_burn) =
      let () = FA2.Storage.assert_token_exist  s token_id in
      FA2.Ledger.increase_token_amount_for_user ledger owner token_id amount_,
      TokenTotalSupply.increase_supply supply token_id amount_
   in
   let (ledger, supply) = List.fold_left process_one (s.ledger, s.extension.extension) lst in
   let s = FA2.Storage.set_ledger s ledger in
   Constants.no_operation, {
      s with extension = Extension.set_extension s.extension supply
    }

let burn (lst : mint_or_burn list) (s : storage) =
   let () = Extension.assert_admin s.extension in
   let process_one ((ledger,supply), {owner;token_id;amount_} : (FA2.Ledger.t * TokenTotalSupply.t) * mint_or_burn) =
      FA2.Ledger.decrease_token_amount_for_user ledger owner token_id amount_,
      TokenTotalSupply.decrease_supply supply token_id amount_
   in
   let (ledger, supply) = List.fold_left process_one (s.ledger, s.extension.extension) lst in
   let s = FA2.Storage.set_ledger s ledger in
   Constants.no_operation,{
      s with extension = Extension.set_extension s.extension supply
    }

(* TZIP-17 *)
let permit (permits : (permit_params list)) (s : storage) =
    let process_permit (ext, permit : extension * permit_params) =
        let (pub_key, (sig, hash_)) = permit in
        let packed = Bytes.pack (((Tezos.get_chain_id()), Tezos.get_self_address()), (ext.counter, hash_)) in
        if Crypto.check pub_key sig packed
        then
            let sender_ = Tezos.address (Tezos.implicit_account (Crypto.hash_key pub_key)) in
            let permit_key = sender_, hash_ in
            match Big_map.find_opt permit_key ext.permits with
            | None -> Extension.add_permit ext permit_key
            | Some submission_timestamp ->
                let () = Extension._check_not_expired s.extension submission_timestamp permit_key in
                Extension.update_permit ext permit_key
        else ([%Michelson ({| { FAILWITH } |} : string * bytes -> extension)]) (Errors.missigned, packed)
    in
    let extension = List.fold_left process_permit s.extension permits in
    Constants.no_operation, { s with extension = extension }

(* TZIP-17 *)
let set_expiry (p : expiry_params) (s : storage) =
    let (user_address, (seconds, permit_hash_opt)) = p in
    let new_storage =
        if seconds > s.extension.max_expiry
        then (failwith Errors.max_seconds_exceeded : storage)
        else if Tezos.get_sender() <> user_address
        then (failwith Errors.forbidden_expiry_update : storage)
        else
                match permit_hash_opt with
                | None ->
                    {
                        s with extension.user_expiries = Big_map.add
                            user_address
                            (Some seconds)
                            s.extension.user_expiries
                    }
                | Some permit_hash ->
                    {
                        s with extension.permit_expiries = Big_map.add
                            (user_address, permit_hash)
                            (Some seconds)
                            s.extension.permit_expiries
                    }
    in Constants.no_operation, new_storage

(* TZIP-17 implementation of TZIP-12 Transfer *)
let transfer_permitted (transfer:FA2.transfer) (s: storage) =
    let make_transfer (acc, transfer_from : (FA2.Ledger.t * extension) * FA2.transfer_from) =
        let (ledger, ext) = acc in
        let transfer_from_hash = Crypto.blake2b (Bytes.pack transfer_from) in
        let permit_key : Extension.permit_key = (transfer_from.from_, transfer_from_hash) in 
        let (is_transfer_authorized, ext) = Extension.transfer_presigned ext permit_key in
        let {from_; txs} = transfer_from in
        let ledger = List.fold
          (fun (ledger, dst : FA2.Ledger.t * FA2.atomic_trans) ->
            let {token_id; amount; to_} = dst in
            let () = FA2.Storage.assert_token_exist s token_id in
            let () = if not is_transfer_authorized then
                FA2.Operators.assert_authorisation s.operators from_ token_id
            in
            let ledger = FA2.Ledger.decrease_token_amount_for_user ledger from_ token_id amount in
            let ledger = FA2.Ledger.increase_token_amount_for_user ledger to_ token_id amount in
            ledger
          ) txs ledger in
          (ledger, ext)
        in
    let (new_ledger, new_ext) = List.fold make_transfer transfer (s.ledger, s.extension)
    in Constants.no_operation, { s with ledger = new_ledger; extension = new_ext }

let set_admin (addr: address) (s: storage) = 
    Constants.no_operation, { s with extension = Extension.set_admin s.extension addr }

type parameter = 
    | Transfer of FA2.transfer
    | Balance_of of FA2.balance_of
    | Update_operators of FA2.update_operators
    | Create_token of FA2.TokenMetadata.data * address * nat
    | Mint_token of mint_or_burn list
    | Burn_token of mint_or_burn list
    | Permit of permit_params list
    | SetExpiry of expiry_params
    | Set_admin of address

let main ((p,s):(parameter * storage)): result = match p with
   Transfer         p -> transfer_permitted p s
|  Balance_of       p -> FA2.balance_of     p s
|  Update_operators p -> FA2.update_ops     p s
|  Create_token     p -> create             p s
|  Mint_token       p -> mint               p s
|  Burn_token       p -> burn               p s
|  Permit           p -> permit             p s
|  SetExpiry        p -> set_expiry         p s
|  Set_admin        p -> set_admin          p s

(*
    Off-chain views required by TZIP-17

    Command to run to get the micheline expressions to put in the metadata:

    ligo compile expression cameligo '_get_counter' \
        --init-file src/main.mligo \
        --project-root . \
        --michelson-format json
*)
let _get_default_expiry ((_,s):(unit * storage)) : nat =
    s.extension.default_expiry

let _get_counter ((_,s):(unit * storage)) : nat =
    s.extension.counter

`,
};

const permitJsligo: Template = {
  name: "Permit-JsLIGO",
  category: "token",
  repository: "https://github.com/ligolang/permit-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of a permit contract in JsLIGO Resources",
  readme: `# permit-jsligo

This example contract implements an FA2 multi-asset contract with a
[TZIP-17](https://tzip.tezosagora.org/proposal/tzip-17/) extension.

In this implementation, permits can be submitted and consumed in [**separate-steps**](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-17/tzip-17.md#separate-step-permit).

## Why permits?

Permits have 2 main use cases:

- making gasless transaction
- avoiding manipulating operators (FA2) or allowances (FA1.2) when a transaction
must be done by a third-party

## Requirements

The contract is written in \`jsligo\` flavour of [LigoLANG](https://ligolang.org/),
to be able to compile the contract, you need either a [ligo binary](https://ligolang.org/docs/intro/installation#static-linux-binary), or [docker](https://docs.docker.com/engine/install/).

For deploy scripts, you also need to have [nodejs](https://nodejs.org/en/) installed,
up to version 14 and docker if you wish to deploy on a sandbox.

## Usage

1. Run \`make install\` to install dependencies
2. Run \`make\` to see available commands
3. You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> PROTOCOL_OPT="--protocol <PROTOCOL>"
\`\`\`

## Use case: taco shop loyalty program

A potential use case is the digitalization of the good old loyalty card.  

### Loyalty Token creation

Expanding on the taco shop tutorial, let's say Pedro creates a new token to
reward his customers.

\`\`\`mermaid
sequenceDiagram
  actor Pedro
  participant FA2
  Note left of Pedro: Pedro create a token
  Pedro->>FA2: Create_token
\`\`\`

### Token distribution

Pedro rewards his customers with one token for each taco bought.

\`\`\`mermaid
sequenceDiagram
  actor Pedro
  participant FA2
  Note left of Pedro: Pedro mint one token to<br> reward tacos buyers
  Pedro->>FA2: Mint_token
\`\`\`

### Permit creation

Alicia is a regular client of the taco shop.  
She already accumulated 10 tokens, which can be exchanged for a free taco.  
One day, she happens to be out of tez, so she decides to use her tokens to pay.

So, she asks Pedro to create a permit.  
The permitted action will be the transfer of 10 tokens from Alicia to Pedro.  
Once Pedro has verified the permit parameters given by Alicia, he calls the smart
contract with them, registering the permit.

\`\`\`mermaid
sequenceDiagram
  actor Alicia
  actor Pedro
  participant FA2
  Note left of Alicia: Alicia signs the transfer parameters
  Alicia->>Pedro: send public key, signature, hash
  Note left of Pedro: Pedro registers Alicia request by creating a permit<br> with her public key, signature and hash.
  Pedro->>FA2: Permit(key, (signature, bytes))
\`\`\`

### Permit consumption

The last step consists in Alicia asking Pedro to consume the permit, by revealing
him the parameters she used for the permit creation, allowing Pedro to call the
\`transfer\` entrypoint with these parameters, actually consuming the permit.

\`\`\`mermaid
sequenceDiagram
  actor Alicia
  actor Pedro
  participant FA2
  Note left of Alicia: Alicia reveals the parameters<br> used for the previously created permit.
  Alicia->>Pedro: reveal params
  Note left of Pedro: Pedro calls the transfer entry point for Alicia
  Pedro->>FA2: Transfer
\`\`\`

## Entrypoints

On top of FA2 standard, the following entrypoints are implemented:

- \`permit\`: allows any sender to register a permit.
- \`setExpiry\`: allows any sender to change its expiry configuration for its own permits.  
  (intended camel case to comply with tzip-17)
- \`transfer\`: overrides FA2 \`transfer\` to add the handling of permitted parameters.

Additionally, for the use case presentation, 3 entrypoints have been added:

- \`create_token\`: creates a token.
- \`mint_token\`: mint a token.
- \`burn_token\`: burn a token.
- \`set_admin\`: to set the authorized account for the 3 above entry points.

## Smart Contract Data Types

\`\`\` mermaid
classDiagram
    Permit <|-- Storage
    UserExpiry <|-- Storage
    PermitExpiry <|-- Storage 

    class Storage {
        defaultExpiry: nat
        counter: nat
    }

    class Permit{
        type t
    }

    class UserExpiry {
        type t
        get(address)
        set(address, nat)
    }

    class PermitExpiry {
        type t
        get(address, bytes)
        set(address, bytes, nat)
    }
\`\`\`

## Resources

- <https://news.ecadlabs.com/understanding-permits-on-tezos-tzip-17-standard-7e470684265c>
- <https://github.com/oxheadalpha/smart-contracts>
`,
  mainFile: `#import "ligo-extendable-fa2/lib/multi_asset/fa2.mligo" "FA2"
#import "./constants.jsligo" "Constants"
#import "./storage.jsligo" "Storage"
#import "./extension.jsligo" "Extension"
#import "./errors.jsligo" "Errors"
#import "./token_total_supply.jsligo" "TokenTotalSupply"

type gen_storage = Storage.t
type token_total_supply = TokenTotalSupply.t
export type storage = gen_storage<token_total_supply>

type result = [list<operation>, storage]

type gen_extension = Extension.t
export type extension = gen_extension<token_total_supply>

export type mintOrBurn = 
// @layout:comb
{
   owner    : address,
   tokenId : nat,
   amount_  : nat,
};

export type permitParams = [key, [signature, bytes]];
export type expiryParams = [address, [nat, option<bytes>]];

const create = ([paramCreate, s] : [[FA2.TokenMetadata.data, address, nat], storage]) : result => {
    let [metadata,owner,amount] = paramCreate;
    Extension.assertAdmin(s.extension);
    let md = Storage.addNewToken(s.token_metadata, metadata.token_id, metadata);
    let s = Storage.setTokenMetadata(s, md);
    let ledger = FA2.Ledger.increase_token_amount_for_user(s.ledger)(owner)(metadata.token_id)(amount);
    let newStore = FA2.Storage.set_ledger(s)(ledger);
    let supply = TokenTotalSupply.createSupply(newStore.extension.extension, metadata.token_id, amount);
    [Constants.noOperation, { ...newStore, extension : Extension.setExtension(s.extension, supply) }]
};

const mint = ([lst, s] : [list<mintOrBurn>, storage]) : result => {
    Extension.assertAdmin(s.extension);
    let processOne = ([ledgerAndSupply, paramMint] : [[FA2.Ledger.t, TokenTotalSupply.t], mintOrBurn]) : [FA2.Ledger.t, TokenTotalSupply.t] => {
        let [ledger,supply] = ledgerAndSupply;
        let {owner,tokenId,amount_} = paramMint;
        FA2.Storage.assert_token_exist(s)(tokenId);
        [
            FA2.Ledger.increase_token_amount_for_user(ledger)(owner)(tokenId)(amount_),
            Extension.TokenTotalSupply.increaseSupply(supply, tokenId, amount_)
        ]
    };
    let [ledger, supply] = List.fold_left(processOne, [s.ledger, s.extension.extension], lst);
    let s = FA2.Storage.set_ledger(s)(ledger);
    [Constants.noOperation, { ...s, extension : Extension.setExtension(s.extension, supply) }]
};

const burn = ([lst, s] : [list<mintOrBurn>, storage]) : result => {
   Extension.assertAdmin(s.extension);
   let processOne = ([ledgerAndSupply, paramBurn] : [[FA2.Ledger.t, Extension.TokenTotalSupply.t], mintOrBurn]) : [FA2.Ledger.t, Extension.TokenTotalSupply.t] => {
      let [ledger,supply] = ledgerAndSupply;
      let {owner,tokenId,amount_} = paramBurn;
      [
        FA2.Ledger.decrease_token_amount_for_user(ledger)(owner)(tokenId)(amount_),
        Extension.TokenTotalSupply.decreaseSupply(supply, tokenId, amount_)
      ]
    };
   let [ledger, supply] = List.fold_left(processOne, [s.ledger, s.extension.extension], lst);
   let s = FA2.Storage.set_ledger(s)(ledger);
   [Constants.noOperation,{ ...s, extension : Extension.setExtension(s.extension, supply) }]
};

// TZIP-17
const permit = ([permits, s] : [list<permitParams>, storage]) : result => {
    let processPermit = ([ext, permit] : [extension, permitParams]) : extension => {
        let [pub_key, [sig, hash_]] = permit;
        let packed = Bytes.pack ([(Tezos.get_chain_id()), Tezos.get_self_address()], [ext.counter, hash_]);
        if (Crypto.check(pub_key, sig, packed)) {
            let sender_ = Tezos.address (Tezos.implicit_account (Crypto.hash_key(pub_key)));
            let paramPermitKey = [sender_, hash_];
            let extModified = match (Big_map.find_opt(paramPermitKey, ext.permits), {
                None: () => {
                    Extension.addPermit(ext, paramPermitKey)
                },
                Some: (submission_timestamp: timestamp) => {
                    Extension._checkNotExpired(s.extension, submission_timestamp, paramPermitKey);
                    Extension.updatePermit(ext, paramPermitKey)
                }
            });
            return extModified;
        } else {
            return (Michelson \`{FAILWITH}\` as ((n: [string, bytes]) => extension)) ([Errors.missigned, packed])
        }
    };
    let extension = List.fold_left(processPermit, s.extension, permits);
    [Constants.noOperation, { ...s, extension : extension }]
};

// TZIP-17
const setExpiry = ([p, s] : [expiryParams, storage]) : result => {
    let [userAddress, [seconds, permitHashOpt]] = p;
    let _checkMaxExpiry : unit = assert_with_error((seconds <= s.extension.maxExpiry), Errors.maxSecondsExceeded);
    let _checkSender : unit = assert_with_error((Tezos.get_sender() == userAddress), Errors.forbiddenExpiryUpdate);
    match (permitHashOpt, {
        None: () => {
            return [
                Constants.noOperation,
                {...s, extension : { ...s.extension, 
                    userExpiries : Big_map.add(userAddress, (Some(seconds)), s.extension.userExpiries) }}
            ];
        },
        Some: (permit_hash: bytes) => {
            return [
                Constants.noOperation,
                { ...s, extension : {...s.extension, permitExpiries : Big_map.add(
                    [userAddress, permit_hash],
                    (Some(seconds)),
                    s.extension.permitExpiries)
                }}
            ]
        }
    });
};

// TZIP-17 implementation of TZIP-12 Transfer
const transferPermitted = ([transfer, s]: [FA2.transfer, storage]) : result => {
     let makeTransfer = ([acc, transferFrom] : [[FA2.Ledger.t, extension], FA2.transfer_from]) : [FA2.Ledger.t, extension] => {
        let [ledger, ext] = acc;
        let transferFromHash = Crypto.blake2b(Bytes.pack(transferFrom));
        let permitKey : Extension.permitKey = [transferFrom.from_, transferFromHash]; 
        const [isTransferAuthorized, ext] = Extension.transferPresigned(ext, permitKey);
        const {from_, txs} = transferFrom;
        let applyTransfer = ([ledger, dst] : [FA2.Ledger.t, FA2.atomic_trans]) : FA2.Ledger.t => {
            let {token_id, amount, to_} = dst;
            FA2.Storage.assert_token_exist(s)(token_id);
            if (!isTransferAuthorized) {
                FA2.Operators.assert_authorisation(s.operators)(from_)(token_id);
                let ledgerModified = FA2.Ledger.decrease_token_amount_for_user(ledger)(from_)(token_id)(amount);
                let ledgerFinal = FA2.Ledger.increase_token_amount_for_user(ledgerModified)(to_)(token_id)(amount);
                return ledgerFinal
            } else {
                let ledgerModified = FA2.Ledger.decrease_token_amount_for_user(ledger)(from_)(token_id)(amount);
                let ledgerFinal = FA2.Ledger.increase_token_amount_for_user(ledgerModified)(to_)(token_id)(amount);
                return ledgerFinal
            }
        };
        let ledger = List.fold(applyTransfer, txs, ledger);
        [ledger, ext]
    };
    let [newLedger, newExt] = List.fold(makeTransfer, transfer, [s.ledger, s.extension]);
    [Constants.noOperation, { ...s, ledger : newLedger, extension : newExt }]
};

const setAdmin = ([addr, s]: [address, storage]) : result => { 
    [Constants.noOperation, { ...s, extension : Extension.setAdmin(s.extension, addr) }]
};

export type parameter = 
    ["Transfer", FA2.transfer] |
    ["Balance_of", FA2.balance_of] |
    ["Update_operators", FA2.update_operators] |
    ["Create_token", [FA2.TokenMetadata.data, address, nat]] |
    ["Mint_token", list<mintOrBurn>] |
    ["Burn_token", list<mintOrBurn>] |
    ["Permit", list<permitParams>] |
    ["SetExpiry", expiryParams] |
    ["SetAdmin", address];

export const main = ([p,s]: [parameter, storage]): result => {
    return match (p, {
        Transfer:         p => transferPermitted(p,s),
        Balance_of:       p => FA2.balance_of(p)(s),
        Update_operators: p => FA2.update_ops(p)(s),
        Create_token:     p => create(p, s),
        Mint_token:       p => mint(p, s),
        Burn_token:       p => burn(p, s),
        Permit:           p => permit(p, s),
        SetExpiry:        p => setExpiry(p, s),
        SetAdmin:         p => setAdmin(p, s)
    })
};

//     Off-chain views required by TZIP-17
//     Command to run to get the micheline expressions to put in the metadata:
//     ligo compile expression cameligo '_get_counter' \
//         --init-file src/main.mligo \
//         --project-root . \
//         --michelson-format json

const getDefaultExpiry = ([_,s]: [unit, storage]) : nat => {
    return s.extension.defaultExpiry
};

const getCounter = ([_,s]: [unit, storage]) : nat => {
    return s.extension.counter
};
`,
};

export default {
  map: {
    [permitCameligo.name]: permitCameligo,
    [permitJsligo.name]: permitJsligo,
  },
  all: [permitCameligo, permitJsligo],
};
