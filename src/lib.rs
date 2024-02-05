mod utils;

use wasm_bindgen::prelude::*;

use nalgebra::*;

const D : usize =2;


#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Particle {
    x : SVector<f64, D>,
    xd: SVector<f64, D>,
    radius: f64
}

pub struct BoundBox {
    lower: SVector<f64, D>,
    upper: SVector<f64, D>
}

#[wasm_bindgen]
pub struct ParticleBox {
        bounds: BoundBox,
        particles: Vec<Particle>,
}

#[wasm_bindgen]
impl ParticleBox {
    pub fn tick(&mut self, dt: f64){
        let mut next = self.particles.clone();

        for i in 0..self.particles.len(){
            let mut new_part = self.particles[i].clone();
            new_part.x = self.particles[i].x + self.particles[i].xd * dt;

            for j in 0..D{
                // position of lower edge of the particle relative to the lower bound.
                let pos_rel_lower = (new_part.x[j] - new_part.radius) - self.bounds.lower[j];

                // position of upper edge of the particle relative to the upper bound.
                let pos_rel_upper = (new_part.x[j] + new_part.radius) - self.bounds.upper[j];
                if pos_rel_lower < 0.0 {

                    new_part.x[j] = self.bounds.lower[j] + new_part.radius - pos_rel_lower;

                    new_part.xd[j] = -self.particles[i].xd[j];
                } else if pos_rel_upper > 0.0 {

                    new_part.x[j] = self.bounds.upper[j] - new_part.radius - pos_rel_upper;

                    new_part.xd[j] = -self.particles[i].xd[j];
                }

            }

            next[i] = new_part;
        }

        for i in 0..self.particles.len(){
            for j in (i+1)..self.particles.len(){
                let delta = next[j].x - next[i].x;
                if delta.norm() < (next[i].radius + next[j].radius){
                    //Collision.
                    if (next[j].xd - next[i].xd).dot(&delta) > 0.0{
                        // j is already moving away. swapping will reinforce collision.
                        continue
                    }

                    let vi_para = (next[i].xd.dot(&delta)/delta.dot(&delta)) * delta;
                    let vi_perp = next[i].xd - vi_para;

                    let vj_para = (next[j].xd.dot(&delta)/delta.dot(&delta)) * delta;
                    let vj_perp = next[j].xd - vj_para;

                    next[i].xd = vi_perp + vj_para;
                    next[j].xd = vj_perp + vi_para;
                }
            }
        }

        self.particles = next;
    }

    pub fn text_render(&mut self) -> String{
        return self.particles.iter().fold("".to_string(), |acc, item| format!("{acc}\nx: {:?}, \tv: {:?}", item.x, item.xd))
    }

    pub fn particles_ptr(&self) -> *const f64 {
        return self.particles[0].x.as_ptr()
    }
    pub fn particles_len(&self) -> usize{
        return self.particles.len()
    }

    pub fn particle_size(&self) -> usize{
        return 2*D+1
    }

    pub fn bbox_ptr(&self) -> *const f64 {
        return self.bounds.lower.as_ptr()
    }



    pub fn new() -> ParticleBox {
        let lower = vector![0.0, 0.0];
        let upper = vector![1.0, 1.0];
        let delta = upper-lower;

        let bbox = BoundBox{
            lower,
            upper,
        };

        const N: usize = 2500;
        let mut particles: Vec<Particle> = Vec::with_capacity(N);

        for _i in 0..N {
            let v1 = lower + delta.component_mul(&SVector::<f64, D>::new_random());
            let mut v2 = Vector2::new_random()-Vector2::from_element(0.5);

            v2 = v2.normalize() * 0.25;

            v2 = 0.1*delta.component_mul(&v2);

            let p = Particle{x: v1, xd: v2, radius: 0.0030};
            particles.push(p);
        }

        return ParticleBox {bounds: bbox , particles};
    }
}
