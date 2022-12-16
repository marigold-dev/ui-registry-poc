import { Template } from "../../types";

const shifumiCameligo: Template = {
  name: "Shifumi-Cameligo",
  category: "token",
  repository: "https://github.com/ligolang/shifumi-cameligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of a shifumi game contract in CameLIGO",
  readme: `# Contract Shifumi

This contract implements a "Shifumi" ([Rock Paper
Scissors](https://en.wikipedia.org/wiki/Rock_paper_scissors) game for 2 players.

This smart contract implements a "commit & reveal" mechanism with chest allowing
players to keep choice secret until all players have played. In order to motivate
players to reveal their secret action, players must lock 10 mutez during "Commit"
and they get back their 10 mutez once the secret action is "revealed".

Users can create a new session and specify players and the number of round.

Players can choose an action (Stone, Paper, Cisor) secretly and commit their
secret choice.
Once all players have chosen their secret action, they can reveal it.

Players can reveal their secret action and commit their secret choice.
Once all players have revealed their secret action (for the current round), the
result for this round is computed and the session goes to the next round.

The result of the session is automatically computed once all rounds have been played.

The smart contract provides an on-chian view for retrieving the session information:

- the status of a session (Inplay, Winner, Draw)
- winners for each round

In the case of a player refusing to play (and keep the session stuck), an
entrypoint has been provided to claim victory for 10 minutes of inactivity.

## Makefile usage

The repository provides a Makefile for compiling/testing/deploying the smart
contract Shifumi. All makefile targets are described with the \`make\` command.

### Compile Shifumi contract

The repository provides a Makefile for compiling the smart contract Shifumi.

\`\`\`sh
make compile
\`\`\`
You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

It compiles the smart contract in TZ file and also in the JSON format

### Test Shifumi contract

The repository provides a Makefile for testing the smart contract Shifumi.

\`\`\`sh
make test
\`\`\`

### Deploy Shifumi contract

The repository provides a deployment script for deploying the smart contract Shifumi.

\`\`\`sh
make sandbox-start
make deploy
\`\`\`

It is based on a .env file that contains deployment information:

\`\`\`sh
ADMIN_PK - private key
ADMIN_ADDRESS - public key
RPC - URL of the RPC node that will process the transaction
\`\`\`
`,
  mainFile: `#import "storage.mligo" "Storage"
#import "parameter.mligo" "Parameter"
#import "views.mligo" "Views"
#import "errors.mligo" "Errors"
#import "session.mligo" "Session"
#import "conditions.mligo" "Conditions"

type storage = Storage.t
type parameter = Parameter.t
type return = operation list * storage

// Anyone can create a session (must specify players and number of rounds)
let createSession(param, store : Parameter.createsession_param * Storage.t) : operation list * Storage.t =
    let new_session : Session.t = Session.new param.total_rounds param.players in
    let new_storage : Storage.t = {store with next_session=store.next_session + 1n; sessions=Map.add store.next_session new_session store.sessions} in
    (([]: operation list), new_storage)

// search for a non troller in the session
let find_me_a_name(sessionId, missing_players, current_session, store :nat * Session.player set * Session.t * Storage.t) : operation list * Storage.t =
    let rem_player(acc, elt : address set * address ) : address set = Set.remove elt acc in
    let winners_set : address set = Set.fold rem_player missing_players current_session.players in
    let _check_has_winner : unit = assert_with_error (Set.cardinal winners_set > 0n) Errors.no_winner in
    let add_player(acc, elt : address list * address) : address list = elt :: acc in
    let winners_list : address list = Set.fold add_player winners_set ([] : address list) in
    let winner : address = Option.unopt (List.head_opt winners_list) in
    let new_current_session : Session.t = { current_session with result=Winner(winner) } in
    let new_storage : Storage.t = Storage.update_sessions store sessionId new_current_session in
    (([]: operation list), new_storage )

// allow players to claim victory if opponent is a troller (refuse to play)
let stopSession(param, store : Parameter.stopsession_param * Storage.t) : operation list * Storage.t =
    let current_session : Session.t = Storage.getSession(param.sessionId, store) in
    let _check_players : unit = Conditions.check_player_authorized (Tezos.get_sender ()) current_session.players Errors.user_not_allowed_to_stop_session in
    let _check_session_end : unit = Conditions.check_session_end current_session.result Inplay in
    let _check_asleep : unit = Conditions.check_asleep(current_session) in
    let current_round = match Map.find_opt current_session.current_round current_session.rounds with
    | None -> ([] : Session.player_actions)
    | Some rnd -> rnd
    in
    let missing_players = Session.find_missing(current_round, current_session.players) in
    if Set.cardinal missing_players > 0n then
        find_me_a_name (param.sessionId, missing_players, current_session, store)
    else
        let current_decoded_round = match Map.find_opt current_session.current_round current_session.decoded_rounds with
        | None -> (failwith("SHOULD NOT BE HERE SESSION IS BROKEN") : Session.decoded_player_actions)
        | Some rnd -> rnd
        in
        let missing_players_for_reveal = Session.find_missing(current_decoded_round, current_session.players) in
        if Set.cardinal missing_players_for_reveal > 0n then
            find_me_a_name (param.sessionId, missing_players_for_reveal, current_session, store)
        else
            (([]: operation list), store )


// the player create a chest with the chosen action (Stone | Paper | Cisor) in backend
// once the chest is created, the player send its chest to the smart contract
let play(param, store : Parameter.play_param * Storage.t) : operation list * Storage.t =
    let current_session : Session.t = Storage.getSession(param.sessionId, store) in
    let sender = Tezos.get_sender () in
    let _check_players : unit = Conditions.check_player_authorized sender current_session.players Errors.user_not_allowed_to_play_in_session in
    let _check_session_end : unit = Conditions.check_session_end current_session.result Inplay in
    let _check_round : unit = assert_with_error (current_session.current_round = param.roundId) Errors.wrong_current_round in
    // register action
    let new_rounds = Session.add_in_rounds current_session.current_round current_session sender param.action in

    let new_session : Session.t = Session.update_rounds current_session new_rounds in
    let new_storage : Storage.t = Storage.update_sessions store param.sessionId new_session in
    (([]: operation list), new_storage)


// Once all players have committed their chest, they must reveal the content of their chest
let reveal (param, store : Parameter.reveal_param * Storage.t) : operation list * Storage.t =
    // players can reveal only if all players have sent their chest
    let current_session : Session.t = Storage.getSession(param.sessionId, store) in
    let sender = Tezos.get_sender () in
    let _check_players : unit = Conditions.check_player_authorized sender current_session.players Errors.user_not_allowed_to_reveal_in_session in
    let _check_session_end : unit = Conditions.check_session_end current_session.result Inplay in
    let _check_round : unit = assert_with_error (current_session.current_round = param.roundId) Errors.wrong_current_round in

    let current_round_actions : Session.player_actions = Session.get_round_actions current_session.current_round current_session in

    let numberOfPlayers : nat = Set.cardinal current_session.players in
    let listsize (acc, _elt: nat * Session.player_action) : nat = acc + 1n in
    let numberOfActions : nat = List.fold listsize current_round_actions 0n in
    let _check_all_players_have_played : unit = assert_with_error (numberOfPlayers = numberOfActions) Errors.missing_player_chest in
    // retrieve user chest (fails if not found)
    let user_chest : chest = Session.get_chest_exn sender (Some(current_round_actions)) in
    // decode action
    let decoded_action : Session.action = Session.decode_chest_exn param.player_key user_chest param.player_secret in
    let new_decoded_rounds = Session.add_in_decoded_rounds current_session.current_round current_session sender decoded_action in
    let new_current_session : Session.t = Session.update_decoded_rounds current_session new_decoded_rounds in

    // compute board if all players have revealed
    let modified_new_current_session : Session.t = Session.finalize_current_round new_current_session in

    // if session is finished, we can compute the result winner
    let final_current_session = Session.finalize_session modified_new_current_session in

    let new_storage : Storage.t = Storage.update_sessions store param.sessionId final_current_session in
    (([]: operation list), new_storage)


let main(ep, store : parameter * storage) : return =
    match ep with
    | CreateSession(p) -> createSession(p, store)
    | Play(p) -> play(p, store)
    | RevealPlay (r) -> reveal(r, store)
    | StopSession (c) -> stopSession(c, store)


[@view] let board(sessionId, store: nat * storage): Views.sessionBoard =
    match Map.find_opt sessionId store.sessions with
    | Some (sess) -> Views.retrieve_board(sess)
    | None -> (failwith("Unknown session") : Views.sessionBoard)`,
};

const shifumiJsligo: Template = {
  name: "Shifumi-Jsligo",
  category: "utilities",
  repository: "https://github.com/ligolang/shifumi-jsligo",
  author: { name: "LIGO" },
  version: "1.0",
  description: "An exemple of a shifumi game contract in JsLIGO",
  readme: `# Contract Shifumi

This contract implements a "Shifumi" ([Rock Paper
Scissors](https://en.wikipedia.org/wiki/Rock_paper_scissors) game for 2 players.

This smart contract implements a "commit & reveal" mechanism with chest allowing
players to keep choice secret until all players have played. In order to motivate
players to reveal their secret action, players must lock 10 mutez during "Commit"
and they get back their 10 mutez once the secret action is "revealed".

Users can create a new session and specify players and the number of round.

Players can choose an action (Stone, Paper, Cisor) secretly and commit their
secret choice.
Once all players have chosen their secret action, they can reveal it.

Players can reveal their secret action and commit their secret choice.
Once all players have revealed their secret action (for the current round), the
result for this round is computed and the session goes to the next round.

The result of the session is automatically computed once all rounds have been played.

The smart contract provides an on-chian view for retrieving the session information:

- the status of a session (Inplay, Winner, Draw)
- winners for each round

In the case of a player refusing to play (and keep the session stuck), an
entrypoint has been provided to claim victory for 10 minutes of inactivity.

## Makefile usage

The repository provides a Makefile for compiling/testing/deploying the smart
contract Shifumi. All makefile targets are described with the \`make\` command.

### Compile Shifumi contract

The repository provides a Makefile for compiling the smart contract Shifumi.

\`\`\`sh
make compile
\`\`\`
You can also override \`make\` parameters by running :
\`\`\`sh
make compile ligo_compiler=<LIGO_EXECUTABLE> protocol_opt="--protocol <PROTOCOL>"
\`\`\`

It compiles the smart contract in TZ file and also in the JSON format

### Test Shifumi contract

The repository provides a Makefile for testing the smart contract Shifumi.

\`\`\`sh
make test
\`\`\`

### Deploy Shifumi contract

The repository provides a deployment script for deploying the smart contract Shifumi.

\`\`\`sh
make sandbox-start
make deploy
\`\`\`

It is based on a .env file that contains deployment information:

\`\`\`sh
ADMIN_PK - private key
ADMIN_ADDRESS - public key
RPC - URL of the RPC node that will process the transaction
\`\`\`
`,
  mainFile: `#import "storage.jsligo" "Storage"
#import "parameter.jsligo" "Parameter"
#import "views.jsligo" "Views"
#import "errors.jsligo" "Errors"
#import "session.jsligo" "Session"
#import "conditions.jsligo" "Conditions"

export type storage = Storage.t;
export type parameter = Parameter.t;
export type return_ = [list<operation>, storage];

// Anyone can create a session (must specify players and number of rounds)
const createSession = ([param, store] : [Parameter.createsession_param, Storage.t]) : return_ => { 
    let new_session : Session.t = Session.new(param.total_rounds, param.players);
    let new_storage : Storage.t = { ...store,  
        next_session: store.next_session + (1 as nat), 
        sessions: Map.add(store.next_session, new_session, store.sessions)
    };
    [list([]) as list<operation>, new_storage]
};

// search for a non troller in the session
const find_me_a_name = ([sessionId, missing_players, current_session, store] : [nat, set<Session.player>, Session.t, Storage.t]) : return_ => { 
    let rem_player = ([acc, elt] : [set<address>, address] ) : set<address> => Set.remove(elt, acc);
    let winners_set : set<address> = Set.fold(rem_player, missing_players, current_session.players);
    let _check_has_winner : unit = assert_with_error( (Set.cardinal(winners_set) > (0 as nat)), Errors.no_winner);
    let add_player = ([acc, elt] : [list<address>, address]) : list<address> => list([elt, ...acc]);
    let winners_list : list<address> = Set.fold(add_player, winners_set, (list([]) as list<address>));
    let winner : address = Option.unopt(List.head_opt(winners_list));
    let new_current_session : Session.t = {...current_session, result:Winner(winner) };
    let new_storage : Storage.t = Storage.update_sessions(store, sessionId, new_current_session);
    return [list([]) as list<operation>, new_storage];
};

// allow players to claim victory if opponent is a troller (refuse to play)
const stopSession = ([param, store] : [Parameter.stopsession_param, Storage.t]) : return_ => {
    let current_session : Session.t = Storage.getSession(param.sessionId, store);
    let _check_players : unit = Conditions.check_player_authorized((Tezos.get_sender ()), current_session.players, Errors.user_not_allowed_to_stop_session);
    let _check_session_end : unit = Conditions.check_session_end(current_session.result, Inplay());
    let _check_asleep : unit = Conditions.check_asleep(current_session);
    let current_round = match (Map.find_opt(current_session.current_round, current_session.rounds), {
        None: () => (list([]) as Session.player_actions),
        Some: (rnd: Session.player_actions) => rnd 
    });
    let missing_players = Session.find_missing(current_round, current_session.players);
    if (Set.cardinal(missing_players) > (0 as nat)) {
        return find_me_a_name (param.sessionId, missing_players, current_session, store);
    } else {
        let current_decoded_round = match (Map.find_opt(current_session.current_round, current_session.decoded_rounds), {
            None: () => (failwith("SHOULD NOT BE HERE SESSION IS BROKEN") as Session.decoded_player_actions),
            Some: (rnd: Session.decoded_player_actions) => rnd 
        });
        let missing_players_for_reveal = Session.find_missing(current_decoded_round, current_session.players);
        if (Set.cardinal(missing_players_for_reveal) > (0 as nat)) {
            return find_me_a_name (param.sessionId, missing_players_for_reveal, current_session, store);
        } else {
            return [list([]) as list<operation>, store]
        }
    }
};

// the player create a chest with the chosen action (Stone | Paper | Cisor) in backend
// once the chest is created, the player send its chest to the smart contract
const play = ([param, store] : [Parameter.play_param, Storage.t]) : return_ => {
    let current_session : Session.t = Storage.getSession(param.sessionId, store);
    let _check_players : unit = Conditions.check_player_authorized((Tezos.get_sender ()), current_session.players, Errors.user_not_allowed_to_play_in_session);
    let _check_session_end : unit = Conditions.check_session_end(current_session.result, Inplay());
    let _check_round : unit = assert_with_error( (current_session.current_round == param.roundId), Errors.wrong_current_round);
    // register action
    let new_rounds = Session.add_in_rounds(current_session.current_round, current_session, (Tezos.get_sender ()), param.action);
    let new_session : Session.t = Session.update_rounds(current_session, new_rounds);
    let new_storage : Storage.t = Storage.update_sessions(store, param.sessionId, new_session);
    return [list([]) as list<operation>, new_storage];
};

// Once all players have committed their chest, they must reveal the content of their chest
const reveal = ([param, store] : [Parameter.reveal_param, Storage.t]) : return_ => {
    // players can reveal only if all players have sent their chest
    let current_session : Session.t = Storage.getSession(param.sessionId, store);
    let _check_players : unit = Conditions.check_player_authorized((Tezos.get_sender ()), current_session.players, Errors.user_not_allowed_to_reveal_in_session);
    let _check_session_end : unit = Conditions.check_session_end(current_session.result, Inplay());
    let _check_round : unit = assert_with_error( (current_session.current_round == param.roundId), Errors.wrong_current_round);
    let current_round_actions : Session.player_actions = Session.get_round_actions(current_session.current_round, current_session);
    let numberOfPlayers : nat = Set.cardinal(current_session.players);
    let listsize = ([acc, _elt]: [nat, Session.player_action]) : nat => acc + (1 as nat);
    let numberOfActions : nat = List.fold(listsize, current_round_actions, (0 as nat));
    let _check_all_players_have_played : unit = assert_with_error( (numberOfPlayers == numberOfActions), Errors.missing_player_chest);
    // retrieve user chest (fails if not found)
    let user_chest : chest = Session.get_chest_exn((Tezos.get_sender ()), (Some(current_round_actions)));
    // decode action
    let decoded_action : Session.action = Session.decode_chest_exn(param.player_key, user_chest, param.player_secret);
    let new_decoded_rounds = Session.add_in_decoded_rounds(current_session.current_round, current_session, (Tezos.get_sender ()), decoded_action);
    let new_current_session : Session.t = Session.update_decoded_rounds(current_session, new_decoded_rounds);

    // compute board if all players have revealed
    let modified_new_current_session : Session.t = Session.finalize_current_round(new_current_session);

    // if session is finished, we can compute the result winner
    let final_current_session = Session.finalize_session(modified_new_current_session);
    
    let new_storage : Storage.t = Storage.update_sessions(store, param.sessionId, final_current_session);
    return [list([]) as list<operation>, new_storage]
};

export const main = ([ep, store] : [parameter, storage]) : return_ => {
    return match (ep, { 
        CreateSession: (p: Parameter.createsession_param) => createSession(p, store),
        Play: (p: Parameter.play_param) => play(p, store),
        RevealPlay: (r: Parameter.reveal_param) => reveal(r, store),
        StopSession: (c: Parameter.stopsession_param) => stopSession(c, store)
        //Play: (p: Parameter.play_param) => [list([]) as list<operation>, new_storage],
        //RevealPlay: (r: Parameter.reveal_param) => [list([]) as list<operation>, new_storage],
        //StopSession: (c: Parameter.stopsession_param) => [list([]) as list<operation>, new_storage]
    });
};

[@view] const board = ([sessionId, store]: [nat, storage]): Views.sessionBoard => { 
    match (Map.find_opt(sessionId, store.sessions), {
        Some: (sess: Session.t) => Views.retrieve_board(sess),
        None: () => (failwith("Unknown session") as Views.sessionBoard)
    });
};`,
};

export default {
  map: {
    [shifumiCameligo.name]: shifumiCameligo,
    [shifumiJsligo.name]: shifumiJsligo,
  },
  all: [shifumiCameligo, shifumiJsligo],
};
