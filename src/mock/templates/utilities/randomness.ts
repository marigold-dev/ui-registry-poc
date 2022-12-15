import { Template } from "../../types";

const randomnessCameligo: Template = {
  name: "Randomness-Cameligo",
  category: "utilities",
  repository: "https://github.com/ligolang/randomness-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "Exemple of a NFT Factory contract in CameLIGO ",
  readme: `## Contract randomness

This smart contract implements an on-chain random number generator. The number generation is based on a random seed and a pseudo-random generator algorithm. In order to have an unbiased seed, users must perform a "Commit & Reveal" mechanism which is perfomed into two separated phases.

First users choose a secret number and send a proof  to the contract. Once all proofs are received users can reveal their secret numbers (and verify the committed proof). In the end all secret numbers are gathered and used to compute a hash (merckle tree), this hash is the random seed and can be converted into a nat.

A Mercenne twister algorithm can be applied in order to generate random number with a satisfying distribution.
A modulus can be applied on the generated number to provide a random number on a specific range.

This smart contract intends to demonstrate the random number generation. The (\`min\`, \`max\`) range is specified in the storage at origination, and the result is stored in the \`result_nat\` field of the storage.

### Compilation of randomness contract

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will delete the compiled smart contract, then compile the smart contract and then launch tests.

A makefile is provided to compile the "Randomness" smart contract, and to launch tests.
\`\`\`
cd src/cameligo/
make compile
make test
\`\`\`

You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.
\`\`\`
cd src/cameligo/
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.

\`\`\`
cd src/cameligo
make deploy
\`\`\`
`,
  mainFile: `#import "storage.mligo" "Storage"
#import "parameter.mligo" "Parameter"
#import "errors.mligo" "Errors"


type storage = Storage.Types.t
type parameter = Parameter.Types.t
type return = operation list * storage

 // Sender commits its chest
let commit(p, st : Parameter.Types.commit_param * storage) : operation list * storage =
    let _check_authorized : unit = assert_with_error (Set.mem (Tezos.get_sender ()) st.participants) Errors.not_authorized in
    let _check_amount : unit = assert_with_error (Tezos.get_amount () >= 10mutez) Errors.commit_expects_10_mutez_lock in
    let new_secrets = match Map.find_opt (Tezos.get_sender ()) st.secrets with
    | None -> Map.add (Tezos.get_sender ()) p.secret_action st.secrets
    | Some _x -> (failwith(Errors.chest_already_committed) : (address, chest) map)
    in
    let new_locked : (address, tez) map = match Map.find_opt (Tezos.get_sender ()) st.locked_tez with
    | None -> Map.add (Tezos.get_sender ()) (Tezos.get_amount ()) st.locked_tez
    | Some val -> Map.update (Tezos.get_sender ()) (Some(val + Tezos.get_amount ())) st.locked_tez
    in
    (([] : operation list), { st with secrets=new_secrets; locked_tez=new_locked })
    

// Sender reveals its chest content
let reveal(p, s : Parameter.Types.reveal_param * storage) : operation list * storage =
    let sender_address : address = Tezos.get_sender () in
    let _check_amount : unit = assert_with_error (Tezos.get_amount () = 0mutez) Errors.reveal_expects_0_mutez_lock in
    let _check_authorized : unit = assert_with_error (Set.mem sender_address s.participants) Errors.not_authorized in
    // check all chest has been received
    let committed = fun (acc, elt : bool * address) : bool -> match Map.find_opt elt s.secrets with
        | None -> acc && false
        | Some _x -> acc && true
    in
    let _all_chests_committed = Set.fold committed s.participants true in

    let _check_all_chests : unit = assert_with_error (_all_chests_committed = true) Errors.missing_chest in

    let (ck, secret) = p in
    let sender_chest : chest = match Map.find_opt sender_address s.secrets with
    | None -> failwith(Errors.missing_chest)
    | Some ch -> ch
    in
    // open chest and stores the chest content
    let decoded_payload =
        match Tezos.open_chest ck sender_chest secret with
        | Ok_opening b -> b
        | Fail_timelock -> (failwith(Errors.fail_open_chest_timelock) : bytes)
        | Fail_decrypt -> (failwith(Errors.fail_open_chest_decrypt) : bytes)
    in
    let new_decoded_payloads = match Map.find_opt sender_address s.decoded_payloads with
    | None -> Map.add (Tezos.get_sender ()) decoded_payload s.decoded_payloads
    | Some _elt -> (failwith(Errors.chest_already_revealed) : (address, bytes) map)
    in 
    // check all chest has been revealed
    let revealed = fun (acc, elt : bool * address) : bool -> match Map.find_opt elt new_decoded_payloads with
        | None -> acc && false
        | Some _x -> acc && true
    in
    let new_locked : (address, tez) map = match Map.find_opt (Tezos.get_sender ()) s.locked_tez with
    | None -> failwith(Errors.wrong_user_balance)
    | Some val ->   
        (match val - 10mutez with
        | None -> failwith(Errors.wrong_amount_locked_tez)
        | Some new_val -> Map.update (Tezos.get_sender ()) (Some(new_val)) s.locked_tez)
    in
    let dest_opt : unit contract option = Tezos.get_contract_opt (Tezos.get_sender ()) in
    let destination : unit contract = match dest_opt with
    | None -> failwith(Errors.unknown_user_account)
    | Some ct -> ct
    in
    let op : operation = Tezos.transaction unit 10mutez destination in 

    let all_chests_revealed = Set.fold revealed s.participants true in
    if all_chests_revealed = true then
        let (seed, value) = Storage.Utils.build_random_nat(new_decoded_payloads, s.min, s.max, s.last_seed) in
        ([op], { s with decoded_payloads=new_decoded_payloads; locked_tez=new_locked; result_nat=(Some(value)); last_seed=seed })  
    else
        ([op], { s with decoded_payloads=new_decoded_payloads; locked_tez=new_locked })

        
let reset (param, store : Parameter.Types.reset_param * storage) : operation list * storage =
    // clean secrets_chest and decoded_payloads
    let _check_amount : unit = assert_with_error (Tezos.get_amount () = 0mutez) Errors.reset_expects_0_mutez_lock in
    (([] : operation list), { store with 
        decoded_payloads=(Map.empty : (address, bytes) map); 
        secrets=(Map.empty : (address, chest) map); 
        result_nat=(None : nat option);
        min=param.min;
        max=param.max 
    })


let main(ep, store : parameter * storage) : return =
    match ep with 
    | Commit(p) -> commit(p, store)
    | Reveal(p) -> reveal(p, store)
    | Reset(p) -> reset(p, store)`,
};

const randomnessJsligo: Template = {
  name: "Randomness-JsLIGO",
  category: "utilities",
  repository: "https://github.com/ligolang/randomness-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of a contract generating a random number in JsLIGO",
  readme: `## Contract randomness

This smart contract implements an on-chain random number generator. The number generation is based on a random seed and a pseudo-random generator algorithm. In order to have an unbiased seed, users must perform a "Commit & Reveal" mechanism which is perfomed into two separated phases.

First users choose a secret number and send a proof  to the contract. Once all proofs are received users can reveal their secret numbers (and verify the committed proof). In the end all secret numbers are gathered and used to compute a hash (merckle tree), this hash is the random seed and can be converted into a nat.

A Mercenne twister algorithm can be applied in order to generate random number with a satisfying distribution.
A modulus can be applied on the generated number to provide a random number on a specific range.

This smart contract intends to demonstrate the random number generation. The (\`min\`, \`max\`) range is specified in the storage at origination, and the result is stored in the \`result_nat\` field of the storage.

### Compilation of randomness contract

This repository provides a Makefile for compiling and testing smart contracts. One can type \`make\` to display all available rules.
The \`make all\` command will delete the compiled smart contract, then compile the smart contract and then launch tests.

A makefile is provided to compile the "Randomness" smart contract, and to launch tests.
\`\`\`
cd src/cameligo/
make compile
make test
\`\`\`

You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

### Tests

A makefile is provided to launch tests.
\`\`\`
cd src/cameligo/
make test
\`\`\`

### Deployment

A typescript script for deployment is provided to originate the smart contrat. This deployment script relies on .env file which provides the RPC node url and the deployer public and private key.

\`\`\`
cd src/cameligo
make deploy
\`\`\`
`,
  mainFile: `#import "storage.jsligo" "Storage"
#import "parameter.jsligo" "Parameter"
#import "errors.jsligo" "Errors"


export type storage = Storage.Types.t;
export type parameter = Parameter.Types.t;
export type return_ = [list<operation>, storage];


// Sender commits its chest
const commit = ([p, st] : [Parameter.Types.commit_param, storage]) : [list<operation>, storage] => {
    let _check_authorized : unit = assert_with_error(Set.mem(Tezos.get_sender(), st.participants), Errors.not_authorized);
    let _check_amount : unit = assert_with_error( (Tezos.get_amount() >= (10 as mutez)), Errors.commit_expects_10_mutez_lock);
    let new_secrets = match (Map.find_opt(Tezos.get_sender(), st.secrets), {
        None: () => Map.add(Tezos.get_sender(), p.secret_action, st.secrets),
        Some: (_x: chest) => (failwith(Errors.chest_already_committed) as map<address, chest>)
    });
    let new_locked : map<address, tez> = match (Map.find_opt(Tezos.get_sender(), st.locked_tez), {
        None: () => Map.add(Tezos.get_sender(), Tezos.get_amount(), st.locked_tez),
        Some: (val: tez) => Map.update(Tezos.get_sender(), (Some(val + Tezos.get_amount())), st.locked_tez)
    });
    return [(list([]) as list<operation>), { ...st, secrets:new_secrets, locked_tez:new_locked }];
};
        
// Sender reveals its chest content
const reveal = ([p, s] : [Parameter.Types.reveal_param, storage]) : [list<operation>, storage] => {
    let sender_address : address = Tezos.get_sender();
    let _check_amount : unit = assert_with_error( (Tezos.get_amount() == (0 as mutez)), Errors.reveal_expects_0_mutez_lock);
    let _check_authorized : unit = assert_with_error( (Set.mem(sender_address, s.participants)), Errors.not_authorized);
    // check all chest has been received
    let committed = ([acc, elt] : [bool, address]) : bool => { 
        match (Map.find_opt(elt, s.secrets), {
            None: () => acc && false,
            Some: (_x: chest) => acc && true
        });
    };
    let _all_chests_committed = Set.fold(committed, s.participants, true);
    let _check_all_chests : unit = assert_with_error( (_all_chests_committed == true), Errors.missing_chest);

    let [ck, secret] = p;
    let sender_chest : chest = match (Map.find_opt(sender_address, s.secrets), {
        None: () => failwith(Errors.missing_chest),
        Some: (ch: chest) => ch
    });

    // open chest and stores the chest content
    let decoded_payload =
        match (Tezos.open_chest(ck, sender_chest, secret), {
            Ok_opening: (b: bytes) => b,
            Fail_timelock: () => (failwith(Errors.fail_open_chest_timelock) as bytes),
            Fail_decrypt: () => (failwith(Errors.fail_open_chest_decrypt) as bytes)
        });
    const new_decoded_payloads = match (Map.find_opt(sender_address, s.decoded_payloads), {
        None: () => Map.add(Tezos.get_sender(), decoded_payload, s.decoded_payloads),
        Some: (_elt: bytes) => (failwith(Errors.chest_already_revealed) as map<address, bytes>)
    });

    // check all chest has been revealed
    let revealed = ([acc, elt] : [bool, address]) : bool => { 
        match (Map.find_opt(elt, new_decoded_payloads), {
            None: () => acc && false,
            Some: (_x: bytes) => acc && true
        });
    };
    let new_locked : map<address, tez> = match (Map.find_opt(Tezos.get_sender(), s.locked_tez), {
        None: () => failwith(Errors.wrong_user_balance),
        Some: (val: tez) => match (val - (10 as mutez), {
            None: () => failwith(Errors.wrong_amount_locked_tez),
            Some: (new_val: tez) => Map.update(Tezos.get_sender(), Some(new_val), s.locked_tez) 
            })     
    });
    let dest_opt : option<contract<unit>> = Tezos.get_contract_opt(Tezos.get_sender());
    let destination : contract<unit> = match (dest_opt, {
        None: () => failwith(Errors.unknown_user_account),
        Some: (ct: contract<unit>) => ct
    });
    let op : operation = Tezos.transaction(unit, 10 as mutez, destination); 

    let all_chests_revealed = Set.fold(revealed, s.participants, true);
    if (all_chests_revealed == true) {
        let rand = Storage.Utils.build_random_nat(new_decoded_payloads, s.min, s.max, s.last_seed);
        let seed = rand[0];
        let value = rand[1];
        return [(list([op]) as list<operation>) , { ...s, decoded_payloads:new_decoded_payloads, locked_tez:new_locked, result_nat:(Some(value)), last_seed:seed }]
    } else {
        return [(list([op]) as list<operation>), { ...s, decoded_payloads:new_decoded_payloads, locked_tez:new_locked }]
    }
};
    
const reset = ([param, store] : [Parameter.Types.reset_param, storage]) : [list<operation>, storage] => {
    // clean secrets_chest and decoded_payloads
    let _check_amount : unit = assert_with_error( (Tezos.get_amount() == (0 as mutez)), Errors.reset_expects_0_mutez_lock);
    return [(list([]) as list<operation>), { ...store,  
        decoded_payloads: (Map.empty as map<address, bytes>),
        secrets: (Map.empty as map<address, chest>),
        result_nat: (None() as option<nat>),
        min: param.min,
        max: param.max 
    }];
};

const main = ([ep, store] : [parameter, storage]) : return_ => {
    return match (ep, { 
    Commit: (p : Parameter.Types.commit_param) => commit(p, store),
    Reveal: (p: Parameter.Types.reveal_param) => reveal(p, store),
    Reset: (p: Parameter.Types.reset_param) => reset(p, store)
    });
};`,
};

export default {
  map: {
    [randomnessCameligo.name]: randomnessCameligo,
    [randomnessJsligo.name]: randomnessJsligo,
  },
  all: [randomnessCameligo, randomnessJsligo],
};
