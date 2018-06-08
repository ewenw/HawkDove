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
        .stage('tutorial')
        .step('welcome')
        .step('instructions')
        .step('survey')
        .stage('tutorial-play')
        .step('practice')
        .gameover();
        //.repeat('game', settings.REPEAT)
        //.next('end')
        //.gameover();

    // Modify the stager to skip one stage.
    stager.skip('tutorial');
    return stager.getState();
};
