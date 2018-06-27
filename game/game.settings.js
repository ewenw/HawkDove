/**
 * # Game settings definition file
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * The variables in this file will be sent to each client and saved under:
 *
 *   `node.game.settings`
 *
 * The name of the chosen treatment will be added as:
 *
 *    `node.game.settings.treatmentName`
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // Variables shared by all treatments.

    // #nodeGame properties:

    /**
     * ## SESSION_ID (number)
     *
     * The name of the first session of the channel
     *
     * The waiting room assigns sequential session ids to every newly
     * spawn game room. The session id is saved in each entry in the
     * memory database of the logics, and used as the name of the
     * session folder in the data/ directory.
     */
    SESSION_ID: 1,

    /**
     * ### TIMER (object) [nodegame-property]
     *
     * Maps the names of the steps of the game to timer durations
     *
     * If a step name is found here, then the value of the property is
     * used to initialize the game timer for the step.
     */
    TIMER: {
        instructions: 60000
    },

    // # Game specific properties

    // Number of game rounds repetitions.
    REPEAT: 2,

    // use tutorial and survey staging; disable for testing
    TUTORIAL: false,

    // payoff table
    PAYOFFS: {
        HH: 0,
        HD: 100,
        DH: 20,
        DD: 60
    }
};
