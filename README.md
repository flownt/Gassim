# rs-wasm-gassim

This is a toy-project to investigate the usefulness of Rust and WebAssembly.
Its development loosely followed the official game-of-life rustwasm [tutorial](https://rustwasm.github.io/docs/book/game-of-life/introduction.html).

The Rust-code implements a simple 2-D gas-model. Particles are circles, collisions are elastic, i.e. momentum is conserved up to numerical precision. All particles start with exactly the same speed in a random direction. The graph on the right demonstrates that collisions quickly redistribute the energy such that the speed of the particles follows the Boltzman-distribution. It is rendered using the Canvas-API in Javascript. The graph on the right is calculated and drawn in Javascript as well.

## Conclusions

* At this time (2024) it is a hassle to efficiently share data between Rust/WebAssembly and the Javascript environment.
* It seems rather difficult or perhaps impossible to implement multiple lookup-tables into the same set of objects using references and the safe lifetime system. If one has to use a pointer-type is it still worth it to use Rust compared to e.g. C++?

