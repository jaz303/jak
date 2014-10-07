function* produce(channel)
    while (true) {
        yield delay(random(250,2000));
        (channel).put(random(1,10));
    }
}

function* consume(channel)
    var i;
    while (true) {
        i = yield (channel).take();
        print(i);
    }
}

function main()
    var channel = $jak_makeChannel();
    $jak_spawn(produce(channel));
    $jak_spawn(consume(channel));
    return 1;
}

