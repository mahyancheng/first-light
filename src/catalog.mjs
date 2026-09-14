// Fictional scenario parameters, not historical prices or benchmark claims.
export const architectures = {
 dense: {name:'Dense transformer',cost:1,quality:1,serve:1,outputs:['text','code','speech','actions'],note:'Predictable training. Every request activates the whole model.'},
 mixture: {name:'Mixture of experts',cost:1.6,quality:1.18,serve:.65,outputs:['text','code','actions'],note:'Higher training and engineering burden; lower inference cost.'},
 state: {name:'State-space network',cost:.8,quality:.88,serve:.45,outputs:['text','code','speech'],note:'Efficient long sequences; trades general capability for throughput.'},
 diffusion: {name:'Diffusion network',cost:1.25,quality:1.1,serve:1.5,outputs:['image','speech'],note:'Iterative generation suits media, with a higher serving burden.'},
};
export const methods = {
 adapt:{name:'Adapt an open model',cost:.5,quarters:1,quality:.78,note:'Fast route to a narrow product. Depends on upstream research.'},
 pretrain:{name:'Pretrain from scratch',cost:1.8,quarters:3,quality:1.25,note:'Own the foundation. Requires more capital, compute and time.'},
 feedback:{name:'Preference learning',cost:1,quarters:2,quality:1.06,note:'Invest in evaluator feedback and task reliability.'},
 distill:{name:'Distillation',cost:.7,quarters:2,quality:.86,note:'Compress a capable teacher into a cheaper serving model.'},
};
export const markets = {
 text:{name:'Business writing',buyers:18000,price:1200,quality:40,growth:.10},
 code:{name:'Developer tools',buyers:12000,price:2400,quality:52,growth:.16},
 image:{name:'Creative studios',buyers:10000,price:1800,quality:45,growth:.12},
 speech:{name:'Voice operations',buyers:7000,price:3000,quality:55,growth:.11},
 actions:{name:'Workflow automation',buyers:4500,price:4800,quality:65,growth:.18},
};
export const suppliers = [
 {id:'northstar',name:'Northstar Cloud',person:'Mara Chen',role:'Compute partnerships',capacity:220,price:12000,minimum:9000,flexibility:.9,description:'Flexible clusters. A shorter commitment costs more, but leaves room to change direction.'},
 {id:'helium',name:'Helium Systems',person:'Ivo Reyes',role:'Infrastructure sales',capacity:140,price:10000,minimum:7600,flexibility:.55,description:'Lower rates for longer reservations. Delivery is bounded by installed capacity.'},
];
export const catalog = {architectures,methods,markets,suppliers};
