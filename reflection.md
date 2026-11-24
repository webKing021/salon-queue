# Reflection — one thing the agent got wrong

**Krutarth Raychura · 202612078 · IT603 Intro to Programming**

**What went wrong.** The waiting times were wrong. After the redesign, the Join screen showed each barber's own
expected wait. With 7 people in the queue, it said **Ravi ~205 min**, while **"Any barber (fastest)" said ~105 min**.
Choosing a barber made you wait twice as long as choosing anyone, which made no sense.

**How I noticed it.** Not from the code. I noticed it by looking at the screen with realistic data (8 sample
customers) and asking whether a real customer would believe the numbers. The agent had followed my rule in
`docs/03-flows-rules.md` exactly. The problem was my rule: "minutes of people ahead who chose that barber
**or 'Any'**" counts every "Any" customer as if Ravi alone would cut all their hair. Once I fixed that,
a second problem appeared: "Any barber (fastest)" (105 min) was now slower than choosing Imran (75 min), because
the "Any" formula divided everyone's minutes by the number of barbers, even people who were waiting for a
specific barber.

**How I fixed my doc and prompt.** I followed the guide's rule *"change the doc first, then prompt"*. I rewrote the
waiting-time rules in `03-flows-rules.md`:
- a customer who chose barber X counts the people who chose X, plus only X's **fair share** of the "Any" people
  ahead (their minutes ÷ barbers available), plus the time left on X's current customer;
- an "Any" customer goes to whoever is free first, so their wait is the **smallest** of the barbers' waits.

Then I asked the agent to implement the new rule and to add tests for it. One test checks that "Any" is never
slower than any single barber. Because all queue rules live in one file (`src/lib/queueRules.js`), the fix
changed the Join screen, My Status, Reception and the TV at the same time.

**What I learned.** The agent does exactly what the document says, including the mistakes. A rule that sounds
fine in plain English can still give silly numbers, so I now check rules with real-looking data instead of
only asking "does the code run?". I also found that some bugs only show up on the real setup. The live site
looked fine until 20 requests were sent at once, and they showed different queues, because each Vercel instance
had its own SQLite file. Testing the deployed site, not only my laptop, caught that.
