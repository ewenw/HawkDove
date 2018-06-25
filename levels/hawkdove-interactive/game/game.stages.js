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
        .repeatStage('game', settings.REPEAT)
        .step('visit')
        .step('respond')
        .next('end')
        .gameover();
        //.repeat('game', settings.REPEAT)
        //.next('end')
        //.gameover();

    return stager.getState();
};
