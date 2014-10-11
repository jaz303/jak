function analyse(ast) {

    // pre:
    // 1. create instance of typesystem
    // 2. create environment populated with "stdlib", including type annotations and stuff
    
    // first pass: 
    // 1. walk AST and build environment(s), including names of all variables
    //    this is probably the right place to check for referencing undeclared vars etc.

    // second pass:
    // 1. assign type annotations, type-check

}