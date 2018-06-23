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
        //.stage('game')
        .step('practice')
        .step('practice_respond')
        //.stage('end')
        .step('practice_end')
        .gameover();
        //.repeat('game', settings.REPEAT)
        //.next('end')
        //.gameover();

    // Modify the stager to skip one stage.
 //stager.skip('tutorial');
   // stager.skip('game');
    return stager.getState();
};
