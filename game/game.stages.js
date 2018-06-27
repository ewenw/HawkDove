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
    if (settings.TUTORIAL){
        stager
        .stage('tutorial')
        .step('welcome')
        .step('instructions')
        .step('survey')
        .step('practice')
        .step('practice_respond')
        .step('practice_end')
        .gameover();
    }
    else {
        stager
        .stage('tutorial')
        .step('welcome')
        .step('instructions')
        .step('survey')
        .stage('game')
        .step('practice')
        .step('practice_respond')
        .stage('end')
        .step('practice_end')
        .gameover();
        stager.skip('tutorial');
        stager.skip('game');
    }
    return stager.getState();
};
