function types() {

    var system = new TypeSystem();
    
    system.add('int',       new IntType());
    system.add('float',     new FloatType());
    system.add('number',    new NumberType());
    system.add('boolean',   new BooleanType());

    return system;

}

function IntType() {

}

function FloatType() {

}

function NumberType() {

}

function BooleanType() {

}

function TypeSystem() {
    this._types = {};
}

TypeSystem.prototype.add = function(name, repr) {
    if (name in this._types) {
        throw new Error("cannot define existing type: " + name);
    }
    this._types[name] = repr;
}

TypeSystem.prototype.get = function(name) {
    if (!(name in this._types)) {
        throw new Error("unknown type: " + name);
    }
    return this._types[name];
}