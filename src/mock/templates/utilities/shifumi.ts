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
  michelson: [
    `{ parameter
    (or (or (pair %createSession (set %players address) (nat %total_rounds))
            (pair %play (pair (bytes %action) (nat %roundId)) (nat %sessionId)))
        (or (pair %revealPlay
               (pair (bytes %player_key) (nat %player_secret))
               (nat %roundId)
               (nat %sessionId))
            (nat %stopSession))) ;
  storage
    (pair (pair (big_map %metadata string bytes) (nat %next_session))
          (map %sessions
             nat
             (pair (pair (pair (timestamp %asleep) (map %board nat (option address)))
                         (nat %current_round)
                         (map %decoded_rounds
                            nat
                            (list (pair (or %action (or (unit %cisor) (unit %paper)) (unit %stone)) (address %player)))))
                   (pair (set %players address)
                         (or %result (or (unit %draw) (unit %inplay)) (address %winner)))
                   (map %rounds nat (list (pair (bytes %action) (address %player))))
                   (nat %total_rounds)))) ;
  code { PUSH bool False ;
         PUSH string "Unknown session" ;
         PUSH string "this session is finished" ;
         PUSH string "Wrong current round parameter" ;
         LAMBDA
           (pair (pair nat (set address))
                 (pair (pair (pair timestamp (map nat (option address)))
                             nat
                             (map nat (list (pair (or (or unit unit) unit) address))))
                       (pair (set address) (or (or unit unit) address))
                       (map nat (list (pair bytes address)))
                       nat)
                 (pair (big_map string bytes) nat)
                 (map nat
                      (pair (pair (pair timestamp (map nat (option address)))
                                  nat
                                  (map nat (list (pair (or (or unit unit) unit) address))))
                            (pair (set address) (or (or unit unit) address))
                            (map nat (list (pair bytes address)))
                            nat)))
           (pair (list operation)
                 (pair (big_map string bytes) nat)
                 (map nat
                      (pair (pair (pair timestamp (map nat (option address)))
                                  nat
                                  (map nat (list (pair (or (or unit unit) unit) address))))
                            (pair (set address) (or (or unit unit) address))
                            (map nat (list (pair bytes address)))
                            nat)))
           { UNPAIR ;
             UNPAIR ;
             DIG 2 ;
             UNPAIR ;
             DUP ;
             CDR ;
             CAR ;
             CAR ;
             DIG 4 ;
             ITER { PUSH bool False ; SWAP ; UPDATE } ;
             PUSH nat 0 ;
             DUP 2 ;
             SIZE ;
             COMPARE ;
             GT ;
             IF {}
                { PUSH string
                       "No players have played in the current round, thus cannot deduce troller" ;
                  FAILWITH } ;
             NIL address ;
             SWAP ;
             ITER { CONS } ;
             IF_CONS { SWAP ; DROP ; SOME } { NONE address } ;
             IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
             DUP 3 ;
             CDR ;
             DUP 3 ;
             CDR ;
             CDR ;
             DIG 2 ;
             RIGHT (or unit unit) ;
             DUP 4 ;
             CDR ;
             CAR ;
             CAR ;
             PAIR ;
             PAIR ;
             DIG 2 ;
             CAR ;
             PAIR ;
             SOME ;
             DIG 3 ;
             UPDATE ;
             SWAP ;
             CAR ;
             PAIR ;
             NIL operation ;
             PAIR } ;
         DIG 5 ;
         UNPAIR ;
         IF_LEFT
           { DIG 2 ;
             DROP ;
             IF_LEFT
               { DIG 2 ;
                 DIG 3 ;
                 DIG 4 ;
                 DIG 5 ;
                 DROP 4 ;
                 DUP ;
                 CDR ;
                 EMPTY_MAP nat (list (pair bytes address)) ;
                 PAIR ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DIG 2 ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 EMPTY_MAP nat (list (pair (or (or unit unit) unit) address)) ;
                 PUSH nat 1 ;
                 PAIR ;
                 EMPTY_MAP nat (option address) ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP 2 ;
                 CDR ;
                 PUSH nat 1 ;
                 DUP 4 ;
                 CAR ;
                 CDR ;
                 ADD ;
                 DUP 4 ;
                 CAR ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 DUP 3 ;
                 CDR ;
                 DIG 2 ;
                 DIG 3 ;
                 CAR ;
                 CDR ;
                 SWAP ;
                 SOME ;
                 SWAP ;
                 UPDATE ;
                 SWAP ;
                 CAR }
               { DUP 2 ;
                 CDR ;
                 DUP 2 ;
                 CDR ;
                 GET ;
                 IF_NONE { DIG 4 ; FAILWITH } { DIG 5 ; DROP } ;
                 SENDER ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 DUP 2 ;
                 MEM ;
                 IF {} { PUSH string "Not allowed to play this session" ; FAILWITH } ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 COMPARE ;
                 EQ ;
                 IF { DIG 5 ; DROP } { DIG 5 ; FAILWITH } ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 EQ ;
                 IF { DIG 4 ; DROP } { DIG 4 ; FAILWITH } ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 DUP 3 ;
                 CDR ;
                 CDR ;
                 CAR ;
                 DUP 2 ;
                 GET ;
                 IF_NONE
                   { DIG 5 ;
                     DROP ;
                     DUP 3 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     NIL (pair bytes address) ;
                     DIG 3 ;
                     DUP 6 ;
                     CAR ;
                     CAR ;
                     PAIR ;
                     CONS ;
                     DIG 2 ;
                     SWAP ;
                     SOME ;
                     SWAP ;
                     UPDATE }
                   { DUP 7 ;
                     DUP 5 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     DUP 4 ;
                     GET ;
                     IF_NONE
                       { DIG 7 }
                       { DIG 8 ;
                         SWAP ;
                         ITER { SWAP ;
                                DUP ;
                                IF { SWAP ; DROP } { DROP ; DUP 5 ; SWAP ; CDR ; COMPARE ; EQ } } } ;
                     COMPARE ;
                     EQ ;
                     IF {} { PUSH string "You already have played for this round" ; FAILWITH } ;
                     DUP 4 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     SWAP ;
                     DIG 3 ;
                     DUP 6 ;
                     CAR ;
                     CAR ;
                     PAIR ;
                     CONS ;
                     SOME ;
                     DIG 2 ;
                     UPDATE } ;
                 DUP 2 ;
                 CDR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 DIG 3 ;
                 CAR ;
                 CAR ;
                 CDR ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP 4 ;
                 CDR ;
                 DUP 2 ;
                 CDR ;
                 CDR ;
                 CDR ;
                 DIG 3 ;
                 PAIR ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 PAIR ;
                 DIG 2 ;
                 CAR ;
                 PAIR ;
                 SOME ;
                 DIG 2 ;
                 CDR ;
                 UPDATE ;
                 SWAP ;
                 CAR } ;
             PAIR ;
             NIL operation ;
             PAIR }
           { IF_LEFT
               { DIG 2 ;
                 DROP ;
                 DUP 2 ;
                 CDR ;
                 DUP 2 ;
                 CDR ;
                 CDR ;
                 GET ;
                 IF_NONE { DIG 4 ; FAILWITH } { DIG 5 ; DROP } ;
                 SENDER ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 DUP 2 ;
                 MEM ;
                 IF {} { PUSH string "Not allowed to reveal this session" ; FAILWITH } ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 COMPARE ;
                 EQ ;
                 IF { DIG 5 ; DROP } { DIG 5 ; FAILWITH } ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 EQ ;
                 IF { DIG 4 ; DROP } { DIG 4 ; FAILWITH } ;
                 DUP 2 ;
                 CDR ;
                 CDR ;
                 CAR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 GET ;
                 IF_NONE { PUSH string "no actions registered" ; FAILWITH } {} ;
                 PUSH nat 0 ;
                 DUP 2 ;
                 ITER { DROP ; PUSH nat 1 ; ADD } ;
                 DUP 4 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SIZE ;
                 COMPARE ;
                 EQ ;
                 IF {} { PUSH string "a player has not played" ; FAILWITH } ;
                 SOME ;
                 DUP 2 ;
                 PAIR ;
                 LEFT (option bytes) ;
                 LOOP_LEFT
                   { UNPAIR ;
                     SWAP ;
                     IF_NONE
                       { DROP ; NONE bytes ; RIGHT (pair address (option (list (pair bytes address)))) }
                       { DUP ;
                         IF_CONS { SWAP ; DROP ; SOME } { NONE (pair bytes address) } ;
                         IF_NONE
                           { DROP 2 ; NONE bytes ; RIGHT (pair address (option (list (pair bytes address)))) }
                           { DUP 3 ;
                             DUP 2 ;
                             CDR ;
                             COMPARE ;
                             EQ ;
                             IF { SWAP ;
                                  DIG 2 ;
                                  DROP 2 ;
                                  CAR ;
                                  SOME ;
                                  RIGHT (pair address (option (list (pair bytes address)))) }
                                { DROP ;
                                  IF_CONS { DROP ; SOME } { NONE (list (pair bytes address)) } ;
                                  SWAP ;
                                  PAIR ;
                                  LEFT (option bytes) } } } } ;
                 IF_NONE { PUSH string "user has not played" ; FAILWITH } {} ;
                 DUP 4 ;
                 CAR ;
                 CAR ;
                 DUP 5 ;
                 CAR ;
                 CDR ;
                 DUP 2 ;
                 PAIR ;
                 PACK ;
                 SHA512 ;
                 DIG 2 ;
                 SWAP ;
                 COMPARE ;
                 EQ ;
                 IF { UNPACK (or (or (unit %cisor) (unit %paper)) (unit %stone)) ;
                      IF_NONE { PUSH string "Failed to unpack the payload" ; FAILWITH } {} }
                    { DROP ; PUSH string "Failed to check bytes" ; FAILWITH } ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 DUP 4 ;
                 CAR ;
                 CDR ;
                 CDR ;
                 DUP 2 ;
                 GET ;
                 IF_NONE
                   { DUP 4 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     NIL (pair (or (or unit unit) unit) address) ;
                     DIG 4 ;
                     DIG 4 ;
                     PAIR ;
                     CONS ;
                     DIG 2 ;
                     SWAP ;
                     SOME ;
                     SWAP ;
                     UPDATE }
                   { DUP 8 ;
                     DUP 6 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     DUP 4 ;
                     GET ;
                     IF_NONE
                       { DUP 9 }
                       { DUP 10 ;
                         SWAP ;
                         ITER { SWAP ;
                                DUP ;
                                IF { SWAP ; DROP } { DROP ; DUP 6 ; SWAP ; CDR ; COMPARE ; EQ } } } ;
                     COMPARE ;
                     EQ ;
                     IF {}
                        { PUSH string "You already have revealed your play for this round" ;
                          FAILWITH } ;
                     DUP 5 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     SWAP ;
                     DIG 4 ;
                     DIG 4 ;
                     PAIR ;
                     CONS ;
                     SOME ;
                     DIG 2 ;
                     UPDATE } ;
                 DUP 2 ;
                 CDR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 DIG 3 ;
                 CAR ;
                 CAR ;
                 CDR ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP ;
                 CDR ;
                 DIG 2 ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 PAIR ;
                 DIG 2 ;
                 CAR ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 DUP ;
                 CAR ;
                 CDR ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 GET ;
                 IF_NONE { NIL (pair (or (or unit unit) unit) address) } {} ;
                 PUSH bool True ;
                 PAIR ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 ITER { SWAP ;
                        UNPAIR ;
                        DUP 2 ;
                        DUP 8 ;
                        DIG 3 ;
                        ITER { SWAP ;
                               DUP ;
                               IF { SWAP ; DROP } { DROP ; DUP 4 ; SWAP ; CDR ; COMPARE ; EQ } } ;
                        DIG 3 ;
                        DROP ;
                        DIG 2 ;
                        AND ;
                        PAIR } ;
                 CAR ;
                 PUSH bool True ;
                 SWAP ;
                 COMPARE ;
                 EQ ;
                 IF { DUP ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      CDR ;
                      PUSH nat 1 ;
                      DUP 4 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      ADD ;
                      PAIR ;
                      DUP 3 ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      DUP ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      DUP 4 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      DUP 5 ;
                      CAR ;
                      CDR ;
                      CDR ;
                      DUP 2 ;
                      GET ;
                      IF_NONE { PUSH string "Missing actions for current_round" ; FAILWITH } {} ;
                      DUP ;
                      IF_CONS { SWAP ; DROP ; SOME } { NONE (pair (or (or unit unit) unit) address) } ;
                      IF_NONE { PUSH string "Missing actions for first player" ; FAILWITH } {} ;
                      SWAP ;
                      IF_CONS { DROP ; SOME } { NONE (list (pair (or (or unit unit) unit) address)) } ;
                      IF_NONE { PUSH string "Missing actions for second player" ; FAILWITH } {} ;
                      IF_CONS { SWAP ; DROP ; SOME } { NONE (pair (or (or unit unit) unit) address) } ;
                      IF_NONE { PUSH string "Missing actions for second player" ; FAILWITH } {} ;
                      DUP ;
                      CAR ;
                      DUP 3 ;
                      CAR ;
                      IF_LEFT
                        { IF_LEFT
                            { DROP ;
                              IF_LEFT
                                { SWAP ;
                                  DROP ;
                                  IF_LEFT { DROP 2 ; NONE address } { DROP ; CDR ; SOME } }
                                { DIG 2 ; DROP 2 ; CDR ; SOME } }
                            { DROP ;
                              IF_LEFT
                                { DIG 2 ;
                                  DROP ;
                                  IF_LEFT { DROP ; CDR ; SOME } { DROP 2 ; NONE address } }
                                { DROP 2 ; CDR ; SOME } } }
                        { DROP ;
                          IF_LEFT
                            { IF_LEFT { DROP 2 ; CDR } { DIG 2 ; DROP 2 ; CDR } ; SOME }
                            { DROP 3 ; NONE address } } ;
                      IF_NONE
                        { DIG 4 ; CAR ; CAR ; CDR ; NONE (option address) ; DIG 2 ; UPDATE }
                        { DIG 5 ; CAR ; CAR ; CDR ; SWAP ; SOME ; SOME ; DIG 2 ; UPDATE } ;
                      DIG 3 ;
                      CAR ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      PAIR }
                    {} ;
                 DUP ;
                 CDR ;
                 CDR ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 GT ;
                 IF { DUP ;
                      CDR ;
                      CDR ;
                      EMPTY_MAP address nat ;
                      DUP 3 ;
                      CAR ;
                      CAR ;
                      CDR ;
                      ITER { CDR ;
                             IF_NONE
                               {}
                               { DUP 2 ;
                                 DUP 2 ;
                                 GET ;
                                 IF_NONE
                                   { SWAP ; PUSH nat 1 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE }
                                   { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } ;
                      DUP 6 ;
                      PUSH nat 0 ;
                      NONE address ;
                      PAIR ;
                      PAIR ;
                      SWAP ;
                      ITER { SWAP ;
                             UNPAIR ;
                             UNPAIR ;
                             DUP ;
                             IF_NONE
                               { DROP 3 ; DUP 6 ; DUP 2 ; CDR ; DIG 2 ; CAR ; SOME }
                               { DROP ;
                                 DUP 2 ;
                                 DUP 5 ;
                                 CDR ;
                                 COMPARE ;
                                 GT ;
                                 IF { DROP 3 ; DUP 6 ; DUP 2 ; CDR ; DIG 2 ; CAR ; SOME }
                                    { DUP 2 ;
                                      DIG 4 ;
                                      CDR ;
                                      COMPARE ;
                                      EQ ;
                                      IF { DIG 2 ; DROP ; PUSH bool True } { DIG 2 } ;
                                      DUG 2 } } ;
                             PAIR ;
                             PAIR } ;
                      DIG 5 ;
                      DROP ;
                      UNPAIR ;
                      CAR ;
                      SWAP ;
                      IF { DROP ; UNIT ; LEFT unit ; LEFT address }
                         { IF_NONE { UNIT ; LEFT unit ; LEFT address } { RIGHT (or unit unit) } } ;
                      DUP 3 ;
                      CDR ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      SWAP ;
                      CAR ;
                      PAIR }
                    { DIG 3 ; DROP } ;
                 DUP 3 ;
                 CDR ;
                 SWAP ;
                 SOME ;
                 DIG 2 ;
                 CDR ;
                 CDR ;
                 UPDATE ;
                 SWAP ;
                 CAR ;
                 PAIR ;
                 NIL operation ;
                 PAIR }
               { DIG 3 ;
                 DIG 6 ;
                 DROP 2 ;
                 DUP 2 ;
                 CDR ;
                 DUP 2 ;
                 GET ;
                 IF_NONE { DIG 4 ; FAILWITH } { DIG 5 ; DROP } ;
                 PUSH string "Not allowed to stop this session" ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SENDER ;
                 MEM ;
                 IF { DROP } { FAILWITH } ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 COMPARE ;
                 EQ ;
                 IF { DIG 4 ; DROP } { DIG 4 ; FAILWITH } ;
                 DUP ;
                 CAR ;
                 CAR ;
                 CAR ;
                 NOW ;
                 COMPARE ;
                 GT ;
                 IF {}
                    { PUSH string
                           "Must wait at least 600 seconds before claiming Victory (in case opponent is not playing)" ;
                      FAILWITH } ;
                 DUP ;
                 CDR ;
                 CAR ;
                 CAR ;
                 DUP 2 ;
                 CDR ;
                 CDR ;
                 CAR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 GET ;
                 IF_NONE { NIL (pair bytes address) } {} ;
                 ITER { CDR ; PUSH bool False ; SWAP ; UPDATE } ;
                 PUSH nat 0 ;
                 DUP 2 ;
                 SIZE ;
                 COMPARE ;
                 GT ;
                 IF { DIG 3 ; DIG 2 ; PAIR ; SWAP ; DIG 2 ; PAIR ; PAIR ; EXEC }
                    { DROP ;
                      DUP ;
                      CAR ;
                      CDR ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      GET ;
                      IF_NONE { PUSH string "SHOULD NOT BE HERE SESSION IS BROKEN" ; FAILWITH } {} ;
                      DUP 2 ;
                      CDR ;
                      CAR ;
                      CAR ;
                      SWAP ;
                      ITER { CDR ; PUSH bool False ; SWAP ; UPDATE } ;
                      PUSH nat 0 ;
                      DUP 2 ;
                      SIZE ;
                      COMPARE ;
                      GT ;
                      IF { DIG 3 ; DIG 2 ; PAIR ; SWAP ; DIG 2 ; PAIR ; PAIR ; EXEC }
                         { SWAP ; DIG 2 ; DIG 4 ; DROP 4 ; NIL operation ; PAIR } } } } } ;
  view "board"
       nat
       (map address nat)
       { UNPAIR ;
         SWAP ;
         CDR ;
         SWAP ;
         GET ;
         IF_NONE
           { PUSH string "Unknown session" ; FAILWITH }
           { EMPTY_MAP address nat ;
             SWAP ;
             CAR ;
             CAR ;
             CDR ;
             ITER { CDR ;
                    IF_NONE
                      {}
                      { DUP 2 ;
                        DUP 2 ;
                        GET ;
                        IF_NONE
                          { SWAP ; PUSH nat 1 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE }
                          { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } } } }

`,
  ],
};

const shifumiJsligo: Template = {
  name: "Shifumi-JsLIGO",
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
  michelson: [
    `{ parameter
    (or (or (pair %createSession (set %players address) (nat %total_rounds))
            (pair %play (pair (bytes %action) (nat %roundId)) (nat %sessionId)))
        (or (pair %revealPlay
               (pair (bytes %player_key) (nat %player_secret))
               (nat %roundId)
               (nat %sessionId))
            (nat %stopSession))) ;
  storage
    (pair (pair (big_map %metadata string bytes) (nat %next_session))
          (map %sessions
             nat
             (pair (pair (pair (timestamp %asleep) (map %board nat (option address)))
                         (nat %current_round)
                         (map %decoded_rounds
                            nat
                            (list (pair (or %action (or (unit %cisor) (unit %paper)) (unit %stone)) (address %player)))))
                   (pair (set %players address)
                         (or %result (or (unit %draw) (unit %inplay)) (address %winner)))
                   (map %rounds nat (list (pair (bytes %action) (address %player))))
                   (nat %total_rounds)))) ;
  code { PUSH string "Wrong current round parameter" ;
         LAMBDA
           (pair (pair address (set address)) string)
           unit
           { UNPAIR ; UNPAIR ; MEM ; IF { DROP ; UNIT } { FAILWITH } } ;
         LAMBDA
           (pair (or (or unit unit) address) (or (or unit unit) address))
           unit
           { UNPAIR ;
             COMPARE ;
             EQ ;
             IF { UNIT } { PUSH string "this session is finished" ; FAILWITH } } ;
         LAMBDA
           (pair (pair (pair (pair (big_map string bytes) nat)
                             (map nat
                                  (pair (pair (pair timestamp (map nat (option address)))
                                              nat
                                              (map nat (list (pair (or (or unit unit) unit) address))))
                                        (pair (set address) (or (or unit unit) address))
                                        (map nat (list (pair bytes address)))
                                        nat)))
                       nat)
                 (pair (pair timestamp (map nat (option address)))
                       nat
                       (map nat (list (pair (or (or unit unit) unit) address))))
                 (pair (set address) (or (or unit unit) address))
                 (map nat (list (pair bytes address)))
                 nat)
           (pair (pair (big_map string bytes) nat)
                 (map nat
                      (pair (pair (pair timestamp (map nat (option address)))
                                  nat
                                  (map nat (list (pair (or (or unit unit) unit) address))))
                            (pair (set address) (or (or unit unit) address))
                            (map nat (list (pair bytes address)))
                            nat)))
           { UNPAIR ;
             UNPAIR ;
             DUP ;
             CDR ;
             DIG 3 ;
             SOME ;
             DIG 3 ;
             UPDATE ;
             SWAP ;
             CAR ;
             PAIR } ;
         LAMBDA
           (pair nat
                 (pair (big_map string bytes) nat)
                 (map nat
                      (pair (pair (pair timestamp (map nat (option address)))
                                  nat
                                  (map nat (list (pair (or (or unit unit) unit) address))))
                            (pair (set address) (or (or unit unit) address))
                            (map nat (list (pair bytes address)))
                            nat)))
           (pair (pair (pair timestamp (map nat (option address)))
                       nat
                       (map nat (list (pair (or (or unit unit) unit) address))))
                 (pair (set address) (or (or unit unit) address))
                 (map nat (list (pair bytes address)))
                 nat)
           { UNPAIR ;
             SWAP ;
             CDR ;
             SWAP ;
             GET ;
             IF_NONE { PUSH string "Unknown session" ; FAILWITH } {} } ;
         LAMBDA
           (pair (lambda
                    (pair (pair (pair (pair (big_map string bytes) nat)
                                      (map nat
                                           (pair (pair (pair timestamp (map nat (option address)))
                                                       nat
                                                       (map nat (list (pair (or (or unit unit) unit) address))))
                                                 (pair (set address) (or (or unit unit) address))
                                                 (map nat (list (pair bytes address)))
                                                 nat)))
                                nat)
                          (pair (pair timestamp (map nat (option address)))
                                nat
                                (map nat (list (pair (or (or unit unit) unit) address))))
                          (pair (set address) (or (or unit unit) address))
                          (map nat (list (pair bytes address)))
                          nat)
                    (pair (pair (big_map string bytes) nat)
                          (map nat
                               (pair (pair (pair timestamp (map nat (option address)))
                                           nat
                                           (map nat (list (pair (or (or unit unit) unit) address))))
                                     (pair (set address) (or (or unit unit) address))
                                     (map nat (list (pair bytes address)))
                                     nat))))
                 (pair (pair nat (set address))
                       (pair (pair (pair timestamp (map nat (option address)))
                                   nat
                                   (map nat (list (pair (or (or unit unit) unit) address))))
                             (pair (set address) (or (or unit unit) address))
                             (map nat (list (pair bytes address)))
                             nat)
                       (pair (big_map string bytes) nat)
                       (map nat
                            (pair (pair (pair timestamp (map nat (option address)))
                                        nat
                                        (map nat (list (pair (or (or unit unit) unit) address))))
                                  (pair (set address) (or (or unit unit) address))
                                  (map nat (list (pair bytes address)))
                                  nat))))
           (pair (list operation)
                 (pair (big_map string bytes) nat)
                 (map nat
                      (pair (pair (pair timestamp (map nat (option address)))
                                  nat
                                  (map nat (list (pair (or (or unit unit) unit) address))))
                            (pair (set address) (or (or unit unit) address))
                            (map nat (list (pair bytes address)))
                            nat)))
           { UNPAIR ;
             SWAP ;
             UNPAIR ;
             UNPAIR ;
             DIG 2 ;
             UNPAIR ;
             LAMBDA
               (pair (set address) address)
               (set address)
               { UNPAIR ; SWAP ; PUSH bool False ; SWAP ; UPDATE } ;
             DUP 2 ;
             CDR ;
             CAR ;
             CAR ;
             DIG 5 ;
             ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
             SWAP ;
             DROP ;
             PUSH string
                  "No players have played in the current round, thus cannot deduce troller" ;
             PUSH nat 0 ;
             DUP 3 ;
             SIZE ;
             COMPARE ;
             GT ;
             IF { DROP } { FAILWITH } ;
             LAMBDA (pair (list address) address) (list address) { UNPAIR ; SWAP ; CONS } ;
             NIL address ;
             DIG 2 ;
             ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
             SWAP ;
             DROP ;
             IF_CONS { SWAP ; DROP ; SOME } { NONE address } ;
             IF_NONE { PUSH string "option is None" ; FAILWITH } {} ;
             DUP 2 ;
             CDR ;
             CDR ;
             SWAP ;
             RIGHT (or unit unit) ;
             DUP 3 ;
             CDR ;
             CAR ;
             CAR ;
             PAIR ;
             PAIR ;
             SWAP ;
             CAR ;
             PAIR ;
             DUG 2 ;
             PAIR ;
             PAIR ;
             EXEC ;
             NIL operation ;
             PAIR } ;
         DUP 3 ;
         APPLY ;
         DIG 6 ;
         UNPAIR ;
         IF_LEFT
           { DIG 2 ;
             DROP ;
             IF_LEFT
               { DIG 2 ;
                 DIG 3 ;
                 DIG 4 ;
                 DIG 5 ;
                 DIG 6 ;
                 DROP 5 ;
                 DUP ;
                 CDR ;
                 EMPTY_MAP nat (list (pair bytes address)) ;
                 PAIR ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DIG 2 ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 EMPTY_MAP nat (list (pair (or (or unit unit) unit) address)) ;
                 PUSH nat 1 ;
                 PAIR ;
                 EMPTY_MAP nat (option address) ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP 2 ;
                 CDR ;
                 PUSH nat 1 ;
                 DUP 4 ;
                 CAR ;
                 CDR ;
                 ADD ;
                 DUP 4 ;
                 CAR ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 DUP 3 ;
                 CDR ;
                 DIG 2 ;
                 DIG 3 ;
                 CAR ;
                 CDR ;
                 SWAP ;
                 SOME ;
                 SWAP ;
                 UPDATE ;
                 SWAP ;
                 CAR ;
                 PAIR }
               { DUP 2 ;
                 DUP 2 ;
                 CDR ;
                 PAIR ;
                 DIG 3 ;
                 SWAP ;
                 EXEC ;
                 PUSH string "Not allowed to play this session" ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SENDER ;
                 PAIR ;
                 PAIR ;
                 DIG 6 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 PAIR ;
                 DIG 5 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 DIG 4 ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 EQ ;
                 IF { DROP } { FAILWITH } ;
                 DUP 2 ;
                 CAR ;
                 CAR ;
                 SENDER ;
                 PAIR ;
                 DUP 2 ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 DIG 2 ;
                 UNPAIR ;
                 DUP 4 ;
                 CDR ;
                 CDR ;
                 CAR ;
                 DUP 4 ;
                 GET ;
                 IF_NONE
                   { DIG 3 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     NIL (pair bytes address) ;
                     DIG 2 ;
                     DIG 3 ;
                     PAIR ;
                     CONS ;
                     DIG 2 ;
                     SWAP ;
                     SOME ;
                     SWAP ;
                     UPDATE }
                   { PUSH string "You already have played for this round" ;
                     PUSH bool False ;
                     DUP 7 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     DUP 7 ;
                     GET ;
                     IF_NONE
                       { PUSH bool False }
                       { LAMBDA
                           (pair address (pair bool bytes address))
                           bool
                           { UNPAIR ;
                             SWAP ;
                             UNPAIR ;
                             DUP ;
                             IF { SWAP ; DIG 2 ; DROP 2 } { DROP ; CDR ; COMPARE ; EQ } } ;
                         DUP 6 ;
                         APPLY ;
                         PUSH bool False ;
                         DIG 2 ;
                         ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                         SWAP ;
                         DROP } ;
                     COMPARE ;
                     EQ ;
                     IF { DROP } { FAILWITH } ;
                     DIG 4 ;
                     CDR ;
                     CDR ;
                     CAR ;
                     SWAP ;
                     DIG 2 ;
                     DIG 3 ;
                     PAIR ;
                     CONS ;
                     SOME ;
                     DIG 2 ;
                     UPDATE } ;
                 SWAP ;
                 DUP ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 DIG 2 ;
                 CAR ;
                 CAR ;
                 CDR ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP ;
                 CDR ;
                 CDR ;
                 CDR ;
                 DIG 2 ;
                 PAIR ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 PAIR ;
                 SWAP ;
                 CAR ;
                 PAIR ;
                 SWAP ;
                 CDR ;
                 DIG 2 ;
                 PAIR ;
                 PAIR ;
                 EXEC } ;
             NIL operation ;
             PAIR }
           { IF_LEFT
               { DIG 2 ;
                 DROP ;
                 DUP 2 ;
                 DUP 2 ;
                 CDR ;
                 CDR ;
                 PAIR ;
                 DIG 3 ;
                 SWAP ;
                 EXEC ;
                 PUSH string "Not allowed to reveal this session" ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SENDER ;
                 PAIR ;
                 PAIR ;
                 DIG 6 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 PAIR ;
                 DIG 5 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 DIG 4 ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 EQ ;
                 IF { DROP } { FAILWITH } ;
                 DUP ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 SWAP ;
                 CDR ;
                 CDR ;
                 CAR ;
                 SWAP ;
                 GET ;
                 IF_NONE { PUSH string "no actions registered" ; FAILWITH } {} ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SIZE ;
                 LAMBDA (pair nat bytes address) nat { CAR ; PUSH nat 1 ; ADD } ;
                 PUSH nat 0 ;
                 DUP 4 ;
                 ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                 SWAP ;
                 DROP ;
                 PUSH string "a player has not played" ;
                 SWAP ;
                 DIG 2 ;
                 COMPARE ;
                 EQ ;
                 IF { DROP } { FAILWITH } ;
                 SOME ;
                 SENDER ;
                 LAMBDA
                   (pair address (option (list (pair bytes address))))
                   (option bytes)
                   { LEFT (option bytes) ;
                     LOOP_LEFT
                       { UNPAIR ;
                         SWAP ;
                         IF_NONE
                           { DROP ; NONE bytes ; RIGHT (pair address (option (list (pair bytes address)))) }
                           { DUP ;
                             IF_CONS { SWAP ; DROP ; SOME } { NONE (pair bytes address) } ;
                             IF_NONE
                               { DROP 2 ; NONE bytes ; RIGHT (pair address (option (list (pair bytes address)))) }
                               { DUP 3 ;
                                 DUP 2 ;
                                 CDR ;
                                 COMPARE ;
                                 EQ ;
                                 IF { SWAP ;
                                      DIG 2 ;
                                      DROP 2 ;
                                      CAR ;
                                      SOME ;
                                      RIGHT (pair address (option (list (pair bytes address)))) }
                                    { DROP ;
                                      IF_CONS { DROP ; SOME } { NONE (list (pair bytes address)) } ;
                                      SWAP ;
                                      PAIR ;
                                      LEFT (option bytes) } } } } } ;
                 DUG 2 ;
                 PAIR ;
                 EXEC ;
                 IF_NONE { PUSH string "user has not played" ; FAILWITH } {} ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 SWAP ;
                 DUP 4 ;
                 CAR ;
                 CAR ;
                 DIG 2 ;
                 DUP 2 ;
                 PAIR ;
                 PACK ;
                 SHA512 ;
                 DIG 2 ;
                 SWAP ;
                 COMPARE ;
                 EQ ;
                 IF { UNPACK (or (or (unit %cisor) (unit %paper)) (unit %stone)) ;
                      IF_NONE { PUSH string "Failed to unpack the payload" ; FAILWITH } {} }
                    { DROP ; PUSH string "Failed to check bytes" ; FAILWITH } ;
                 SENDER ;
                 PAIR ;
                 DUP 2 ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 DIG 2 ;
                 UNPAIR ;
                 DUP 4 ;
                 CAR ;
                 CDR ;
                 CDR ;
                 DUP 4 ;
                 GET ;
                 IF_NONE
                   { DIG 3 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     NIL (pair (or (or unit unit) unit) address) ;
                     DIG 2 ;
                     DIG 3 ;
                     PAIR ;
                     CONS ;
                     DIG 2 ;
                     SWAP ;
                     SOME ;
                     SWAP ;
                     UPDATE }
                   { PUSH string "You already have revealed your play for this round" ;
                     PUSH bool False ;
                     DUP 7 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     DUP 7 ;
                     GET ;
                     IF_NONE
                       { PUSH bool False }
                       { LAMBDA
                           (pair address (pair bool (or (or unit unit) unit) address))
                           bool
                           { UNPAIR ;
                             SWAP ;
                             UNPAIR ;
                             DUP ;
                             IF { SWAP ; DIG 2 ; DROP 2 } { DROP ; CDR ; COMPARE ; EQ } } ;
                         DUP 6 ;
                         APPLY ;
                         PUSH bool False ;
                         DIG 2 ;
                         ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                         SWAP ;
                         DROP } ;
                     COMPARE ;
                     EQ ;
                     IF { DROP } { FAILWITH } ;
                     DIG 4 ;
                     CAR ;
                     CDR ;
                     CDR ;
                     SWAP ;
                     DIG 2 ;
                     DIG 3 ;
                     PAIR ;
                     CONS ;
                     SOME ;
                     DIG 2 ;
                     UPDATE } ;
                 SWAP ;
                 DUP ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 DIG 2 ;
                 CAR ;
                 CAR ;
                 CDR ;
                 PUSH int 600 ;
                 NOW ;
                 ADD ;
                 PAIR ;
                 PAIR ;
                 PAIR ;
                 DUP ;
                 CDR ;
                 DIG 2 ;
                 DUP 3 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 PAIR ;
                 DIG 2 ;
                 CAR ;
                 CAR ;
                 PAIR ;
                 PAIR ;
                 DUP ;
                 CAR ;
                 CDR ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 GET ;
                 IF_NONE { NIL (pair (or (or unit unit) unit) address) } {} ;
                 LAMBDA
                   (pair (pair bool (list (pair (or (or unit unit) unit) address))) address)
                   (pair bool (list (pair (or (or unit unit) unit) address)))
                   { UNPAIR ;
                     UNPAIR ;
                     SWAP ;
                     DUP ;
                     DIG 3 ;
                     DIG 2 ;
                     LAMBDA
                       (pair address (pair bool (or (or unit unit) unit) address))
                       bool
                       { UNPAIR ;
                         SWAP ;
                         UNPAIR ;
                         DUP ;
                         IF { SWAP ; DIG 2 ; DROP 2 } { DROP ; CDR ; COMPARE ; EQ } } ;
                     DUP 3 ;
                     APPLY ;
                     DIG 2 ;
                     DROP ;
                     PUSH bool False ;
                     DIG 2 ;
                     ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                     SWAP ;
                     DROP ;
                     DIG 2 ;
                     AND ;
                     PAIR } ;
                 SWAP ;
                 PUSH bool True ;
                 PAIR ;
                 DUP 3 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                 SWAP ;
                 DROP ;
                 CAR ;
                 PUSH bool True ;
                 SWAP ;
                 COMPARE ;
                 EQ ;
                 IF { DUP ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      CDR ;
                      PUSH nat 1 ;
                      DUP 4 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      ADD ;
                      PAIR ;
                      DUP 3 ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      DUP ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      DUP 4 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      DUP 5 ;
                      CAR ;
                      CDR ;
                      CDR ;
                      DUP 2 ;
                      GET ;
                      IF_NONE { PUSH string "Missing actions for current_round" ; FAILWITH } {} ;
                      DUP ;
                      IF_CONS { SWAP ; DROP ; SOME } { NONE (pair (or (or unit unit) unit) address) } ;
                      IF_NONE { PUSH string "Missing actions for first player" ; FAILWITH } {} ;
                      SWAP ;
                      IF_CONS { DROP ; SOME } { NONE (list (pair (or (or unit unit) unit) address)) } ;
                      IF_NONE { PUSH string "Missing actions for second player" ; FAILWITH } {} ;
                      IF_CONS { SWAP ; DROP ; SOME } { NONE (pair (or (or unit unit) unit) address) } ;
                      IF_NONE { PUSH string "Missing actions for second player" ; FAILWITH } {} ;
                      SWAP ;
                      DUP ;
                      CAR ;
                      IF_LEFT
                        { IF_LEFT
                            { DROP ;
                              DUP 2 ;
                              CAR ;
                              IF_LEFT
                                { DIG 2 ;
                                  DROP ;
                                  IF_LEFT { DROP 2 ; NONE address } { DROP ; CDR ; SOME } }
                                { DROP 2 ; CDR ; SOME } }
                            { DROP ;
                              DUP 2 ;
                              CAR ;
                              IF_LEFT
                                { SWAP ;
                                  DROP ;
                                  IF_LEFT { DROP ; CDR ; SOME } { DROP 2 ; NONE address } }
                                { DIG 2 ; DROP 2 ; CDR ; SOME } } }
                        { DROP ;
                          DUP 2 ;
                          CAR ;
                          IF_LEFT
                            { IF_LEFT { DIG 2 ; DROP 2 ; CDR } { DROP 2 ; CDR } ; SOME }
                            { DROP 3 ; NONE address } } ;
                      IF_NONE
                        { DIG 4 ; CAR ; CAR ; CDR ; NONE (option address) ; DIG 2 ; UPDATE }
                        { DIG 5 ; CAR ; CAR ; CDR ; SWAP ; SOME ; SOME ; DIG 2 ; UPDATE } ;
                      DIG 3 ;
                      CAR ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      PAIR }
                    {} ;
                 DUP ;
                 CDR ;
                 CDR ;
                 CDR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 COMPARE ;
                 GT ;
                 IF { DUP ;
                      CDR ;
                      CDR ;
                      LAMBDA
                        (pair (map address nat) nat (option address))
                        (map address nat)
                        { UNPAIR ;
                          SWAP ;
                          CDR ;
                          IF_NONE
                            {}
                            { DUP 2 ;
                              DUP 2 ;
                              GET ;
                              IF_NONE
                                { SWAP ; PUSH nat 1 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE }
                                { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } ;
                      EMPTY_MAP address nat ;
                      DUP 4 ;
                      CAR ;
                      CAR ;
                      CDR ;
                      ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                      SWAP ;
                      DROP ;
                      NONE address ;
                      PUSH nat 0 ;
                      PUSH bool False ;
                      LAMBDA
                        (pair (pair (pair (option address) nat) bool) address nat)
                        (pair (pair (option address) nat) bool)
                        { UNPAIR ;
                          UNPAIR ;
                          UNPAIR ;
                          SWAP ;
                          DIG 2 ;
                          DUP 3 ;
                          IF_NONE
                            { DROP 3 ; PUSH bool False ; DUP 2 ; CDR ; DIG 2 ; CAR ; SOME }
                            { DROP ;
                              DUP 2 ;
                              DUP 5 ;
                              CDR ;
                              COMPARE ;
                              GT ;
                              IF { DROP 3 ; PUSH bool False ; DUP 2 ; CDR ; DIG 2 ; CAR ; SOME }
                                 { DUP 2 ;
                                   DIG 4 ;
                                   CDR ;
                                   COMPARE ;
                                   EQ ;
                                   IF { DROP ; PUSH bool True } {} ;
                                   SWAP ;
                                   DIG 2 } } ;
                          PAIR ;
                          PAIR } ;
                      SWAP ;
                      DIG 2 ;
                      DIG 3 ;
                      PAIR ;
                      PAIR ;
                      DIG 2 ;
                      ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                      SWAP ;
                      DROP ;
                      UNPAIR ;
                      CAR ;
                      SWAP ;
                      IF { DROP ; UNIT ; LEFT unit ; LEFT address }
                         { IF_NONE { UNIT ; LEFT unit ; LEFT address } { RIGHT (or unit unit) } } ;
                      DUP 3 ;
                      CDR ;
                      CAR ;
                      CAR ;
                      PAIR ;
                      PAIR ;
                      SWAP ;
                      CAR ;
                      PAIR }
                    {} ;
                 SWAP ;
                 CDR ;
                 CDR ;
                 DIG 2 ;
                 PAIR ;
                 PAIR ;
                 EXEC ;
                 NIL operation ;
                 PAIR }
               { DIG 4 ;
                 DIG 7 ;
                 DROP 2 ;
                 DUP 2 ;
                 DUP 2 ;
                 PAIR ;
                 DIG 4 ;
                 SWAP ;
                 EXEC ;
                 PUSH string "Not allowed to stop this session" ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SENDER ;
                 PAIR ;
                 PAIR ;
                 DIG 6 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 UNIT ;
                 RIGHT unit ;
                 LEFT address ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CDR ;
                 PAIR ;
                 DIG 5 ;
                 SWAP ;
                 EXEC ;
                 DROP ;
                 DUP ;
                 PUSH string
                      "Must wait at least 600 seconds before claiming Victory (in case opponent is not playing)" ;
                 SWAP ;
                 CAR ;
                 CAR ;
                 CAR ;
                 NOW ;
                 COMPARE ;
                 GT ;
                 IF { DROP } { FAILWITH } ;
                 DUP ;
                 CDR ;
                 CDR ;
                 CAR ;
                 DUP 2 ;
                 CAR ;
                 CDR ;
                 CAR ;
                 GET ;
                 IF_NONE { NIL (pair bytes address) } {} ;
                 DUP 2 ;
                 CDR ;
                 CAR ;
                 CAR ;
                 SWAP ;
                 LAMBDA
                   (pair (set address) bytes address)
                   (set address)
                   { UNPAIR ; SWAP ; CDR ; PUSH bool False ; SWAP ; UPDATE } ;
                 DUG 2 ;
                 ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                 SWAP ;
                 DROP ;
                 PUSH nat 0 ;
                 DUP 2 ;
                 SIZE ;
                 COMPARE ;
                 GT ;
                 IF { DIG 3 ; DIG 2 ; PAIR ; SWAP ; DIG 2 ; PAIR ; PAIR ; EXEC }
                    { DROP ;
                      DUP ;
                      CAR ;
                      CDR ;
                      CDR ;
                      DUP 2 ;
                      CAR ;
                      CDR ;
                      CAR ;
                      GET ;
                      IF_NONE { PUSH string "SHOULD NOT BE HERE SESSION IS BROKEN" ; FAILWITH } {} ;
                      DUP 2 ;
                      CDR ;
                      CAR ;
                      CAR ;
                      SWAP ;
                      LAMBDA
                        (pair (set address) (or (or unit unit) unit) address)
                        (set address)
                        { UNPAIR ; SWAP ; CDR ; PUSH bool False ; SWAP ; UPDATE } ;
                      DUG 2 ;
                      ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
                      SWAP ;
                      DROP ;
                      PUSH nat 0 ;
                      DUP 2 ;
                      SIZE ;
                      COMPARE ;
                      GT ;
                      IF { DIG 3 ; DIG 2 ; PAIR ; SWAP ; DIG 2 ; PAIR ; PAIR ; EXEC }
                         { SWAP ; DIG 2 ; DIG 4 ; DROP 4 ; NIL operation ; PAIR } } } } } ;
  view "board"
       nat
       (map address nat)
       { UNPAIR ;
         SWAP ;
         CDR ;
         SWAP ;
         GET ;
         IF_NONE
           { PUSH string "Unknown session" ; FAILWITH }
           { EMPTY_MAP address nat ;
             LAMBDA
               (pair (map address nat) nat (option address))
               (map address nat)
               { UNPAIR ;
                 SWAP ;
                 CDR ;
                 IF_NONE
                   {}
                   { DUP 2 ;
                     DUP 2 ;
                     GET ;
                     IF_NONE
                       { SWAP ; PUSH nat 1 ; DIG 2 ; SWAP ; SOME ; SWAP ; UPDATE }
                       { DIG 2 ; PUSH nat 1 ; DIG 2 ; ADD ; SOME ; DIG 2 ; UPDATE } } } ;
             SWAP ;
             DIG 2 ;
             CAR ;
             CAR ;
             CDR ;
             ITER { SWAP ; PAIR ; DUP 2 ; SWAP ; EXEC } ;
             SWAP ;
             DROP } } }

`,
  ],
};

export default {
  map: {
    [shifumiCameligo.name]: shifumiCameligo,
    [shifumiJsligo.name]: shifumiJsligo,
  },
  all: [shifumiCameligo, shifumiJsligo],
};
