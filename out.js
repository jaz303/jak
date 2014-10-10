//
// Channels

function $jak_makeChannel() {
    return new $JakChannel();
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
var $jak_isScheduled = false;

function $jak_scheduleTick() {
    if ($jak_isScheduled) return;
    $jak_isScheduled = true;
    process.nextTick($jak_tick);
}

function $jak_isGenerator(fn) {
    return fn.constructor.name === 'GeneratorFunction';
}

function $jak_isGeneratorInstance(obj) {
    return obj.constructor.name === 'GeneratorFunctionPrototype';
}

function $jak_isPromise(obj) {
    return obj && (typeof obj.then === 'function');
}

function $JakTask(gen) {
    this.stack = [gen];
    this.memo = void 0;
}

function $jak_spawn(generator) {
    var task = new $JakTask(generator);
    $jak_tasks.push(task);
    $jak_scheduleTick();
    return task;
}

// TODO: this is sub-optimal; we should have separate wait queue
// and just cycle the available tasks in while loop, entering
// nested generators synchronously until a Promise is returned.
function $jak_tick() {

    $jak_isScheduled = false;

    var task = $jak_tasks.shift();
    if (!task) return;

    var stack = task.stack;

    while (stack.length) {
        var result = stack[stack.length-1].next(task.memo);
        if (result.done) {
            stack.pop();
            task.memo = result.value;
        } else if ($jak_isGeneratorInstance(result.value)) {
            stack.push(result.value);
            task.memo = void 0;
        } else if ($jak_isPromise(result.value)) {
            result.value.then(function(res) {
                task.memo = res;
                $jak_tasks.push(task);
                $jak_scheduleTick();
            });
            break;
        } else {
            task.memo = result.value;
        }
    }

    $jak_scheduleTick();

    return;
    

    var result = task.stack[task.stack.length-1].next(task.memo);

    if (result.done) {
        task.stack.pop();
        if (task.stack.length) {
            task.memo = result.value;
            $jak_tasks.push(task);
        }
        if ($jak_tasks.length) {
            process.nextTick($jak_tick);
        }
        return;
    }

    // if we've got a promise, this task is suspended until
    // the promise is resolved.
    if ($jak_isPromise(result.value)) {
        result.value.then(function(res) {
            task.memo = res;
            $jak_tasks.push(task);
            $jak_tick();
        });
        return;
    }

    // if we've got a generator that means the task has invoked
    // an asynchronous function. push the generator onto the
    // stack and schedule the next tick
    if ($jak_isGeneratorInstance(result.value)) {
        task.stack.push(result.value);
        task.memo = void 0;
        process.nextTick($jak_tick);
        return;
    }

    // otherwise it's just a value to return to the generator
    task.memo = result.value; // is this right?
    $jak_tasks.push(task);
    process.nextTick($jak_tick);

}

function $jak_run() {
    if ($jak_isGenerator(main)) {
        $jak_spawn(main());
    } else {
        $jak_spawn((function*() { main(); })());
    }
    $jak_scheduleTick();
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

//
// BEGIN USERCODE

function* produce(channel) {
    while (true) {
        yield delay(random(100,1000));
        (channel).put(random(1,10));
    }
}

function* consume(channel) {
    var i;
    while (true) {
        i = yield (channel).take();
        print(i);
    }
}

function main() {
    var channel = $jak_makeChannel();
    $jak_spawn(produce(channel));
    $jak_spawn(consume(channel));
    return 1;
}


// END USERCODE
//

$jak_run();
