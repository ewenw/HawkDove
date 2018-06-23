/**
 * # Game stages definition file
 * Copyright(c) 2018 Ewen <wang.yuxu@husky.neu.edu>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

     stager
        .repeat('game', settings.REPEAT)
        .next('end')
        .gameover();
        //.repeat('game', settings.REPEAT)
        //.next('end')
        //.gameover();
    stager.extendStage('game', {
        steps: [
            'visit',
            'respond'
        ]
    });

    return stager.getState();
};
