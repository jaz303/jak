//
// Channels

function $jak_makeChannel() {
    return new Channel();
}

// function select(channels) {
//  return new Promise(function(resolve, reject) {

//      var fulfilled = false;
        

//  });
//  // TODO: this isn't right.
//  // firstly, need to return a (channel,value) tuple
//  // secondly, need to ensure we only consume one value
//  // across all supplied channels
//  return Promise.race(channels.map(function(c) {
//      return c.take();
//  }));
// }

function $JakChannel() {
    this._queue = [];
    this._waiters = [];
}

$JakChannel.prototype.take = function(state) {

    // ...
    // same as usual take, except push state as well
    // drain routine 

}

$JakChannel.prototype.take = function() {

    var _resolve = null;
    var promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
    });

    promise.resolve = _resolve;
    
    this._waiters.push(promise);
    if (this._queue.length) {
        this._drain();  
    }
    
    return promise;

}

$JakChannel.prototype.put = function(item) {
    this._queue.push(item);
    this._drain();
}

$JakChannel.prototype._drain = function() {
    
    if (this._drainRequested) return;
    this._drainRequested = true;

    var self = this;
    setTimeout(function() {
        self._drainRequested = false;
        while (self._queue.length && self._waiters.length) {
            self._waiters.shift().resolve(self._queue.shift());
        }
    }, 0);

}

//
// Engine

var $jak_tasks = [];

function $jak_spawn(generator) {
    $jak_tasks.push([generator, void 0]);
}

function $jak_tick() {
    var task = $jak_tasks.shift();
    var result = task[0].next(task[1]);
    if (result.done) {
        // do nothing; task complete
    } else if (result.value && typeof result.value.then === 'function') {
        result.value.then(function(res) {
            task[1] = true;
            $jak_tasks.push(task);
            tick();
        });
    } else {
        $jak_tasks.push(task);
        process.nextTick(tick);
    }
}

function $jak_functionIsGenerator(fn) {
    return fn.constructor.name === 'GeneratorFunction';
}

function $jak_run() {
    if ($jak_functionIsGenerator(main)) {
        $jak_spawn(main());
    } else {
        $jak_spawn(function*() { main(); });
    }
    $jack_tick();
}

/*
// if we're calling an async function this is all we need to do.
// any function that calls an async function must itself be
// async.
var gen = doWork(id, item);
var res = gen.next();
while (!res.done) { yield res.value; res = gen.next(); }

// alternative to the above:
// yield the generator itself back to the scheduler
// scheduler checks for a generator, if it finds one it adds it
// to this task's generator stack and begins to cycle it.
// yield doWork(id, item)
//
// how to detect a generator:
// var GeneratorInstance = (function *(){})().constructor
// foo instanceof GeneratorInstance
*/

//
// "stdlib"

function random(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

function delay(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}

function print(message) {
    console.log(message);
}
