# jacks-design-concepts

A skill for generating several different UI/UX design concepts from one prompt.

## The problem

LLMs tend to converge on steriotypical design language in the same way it tends to
converge on steriotypical prose (a.k.a. "claude-ese"). Forcing creativity is difficult. 

## How the skill counters it

Three levers, in order of impact:

1. **Pre-assigned orthogonal territories.** Each concept is handed a distinct design
   axis it must diverge on, so no two agents can grab the same default.
2. **String Seed of Thought (SSoT).** Each agent gets one externally generated random
   string, decomposes the design into decision points, enumerates options per point,
   and selects each option by arithmetic on a segment of the seed — sampling, not
   interpreting.
3. **A diversity referee.** One agent reads all concepts, flags convergence, forces
   pivots.

## Research Basis

The design of this skill is grounded in three findings from the literature.

**Random text in the prompt raises output diversity.** Prepending random
words/sentences unrelated to the prompt measurably increases the entropy of LLM
outputs, counteracting the "long-tail" / mode-collapse tendency to oversample common
responses. The effect holds across models, and a single injection is enough — stacking
more random strings adds nothing. This is the direct basis for the skill's rule that
each agent gets exactly one seed.

> Agrawal, Pulin, and Prasoon Goyal. *Addressing LLM Diversity by Infusing Random
> Concepts.* arXiv:2601.18053v1 [cs.CL], 26 Jan 2026.

**A random string, manipulated arithmetically, makes generation distribution-faithful.**
String Seed of Thought instructs the model to first generate a random string, then
derive its answer by manipulating that string, rather than emitting a plausible-looking
answer directly. This substantially improves probabilistic faithfulness and output
diversity with no training or external tools — only a prompt change. This is the source
of the skill's decompose → enumerate → select-by-`sum(ASCII) mod n` procedure. (The
skill uses an *externally* generated seed rather than a model-invented one, to guarantee
independence across parallel agents.)

> Misaki, Kou, and Takuya Akiba. *String Seed of Thought: Prompting LLMs for
> Distribution-Faithful and Diverse Generation.* Sakana AI, April 2026.
> https://pub.sakana.ai/ssot/

**Injecting noise at the input is a real alternative to temperature.** Next-token
learning is myopic on open-ended creative tasks; eliciting randomness by
"seed-conditioning" (injecting noise at the input layer) works as well as, and sometimes
better than, temperature sampling at the output layer — without hurting coherence. This
supports the skill's claim that the seed-driven diversity effect is largely independent
of temperature.

> Nagarajan, Vaishnavh, Chen Henry Wu, Charles Ding, and Aditi Raghunathan. *Roll the
> Dice & Look Before You Leap: Going Beyond the Creative Limits of Next-Token
> Prediction.* Proceedings of the 42nd International Conference on Machine Learning
> (PMLR 267), 2025. arXiv:2504.15266v4.
