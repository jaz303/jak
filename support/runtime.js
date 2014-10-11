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

}

function $jak_run() {
    if ($jak_isGenerator(main)) {
        $jak_spawn(main());
    } else {
        $jak_spawn((function*() { main(); })());
    }
    $jak_scheduleTick();
}

//
// Operators

function $jak_binop_int_plus_int(left, right) {
    return left + right;
}

function $jak_binop_int_minus_int(left, right) {
    return left - right;
}

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

