# Reading the sentences

> Gate 5b of [finishing a phase](SKILL.md), open only when this phase wrote or moved a line a person will read. The gallery proves a line fits; nothing else asks whether it is something a person would say.

Two releases shipped *«Дурак в этот вечер был — и всё равно 9 партий подряд
начисто»* and *«К середине — дно графика и 28%, сейчас — 50%»*, both drawn correctly,
both read by a poster reader, both word salad; the owner found seven of them in ten
minutes on a Friday night.

They survive because a copy table is read as **templates**, by the person who wrote
them, in the language they were composed in. `` `... и всё равно ${streak} подряд
начисто` `` looks like a sentence with a hole in it. The hole is where the meaning was.

So the reading is the **`copy-reader`** agent's, and it may not be done by whoever
wrote the table. What the brief must carry is that agent's own section, and so are
the four questions it asks. It reads **every** line filled in with real values, not
only the ones a poster happens to draw; the lines nothing draws are where this rot
survives longest.

**A drawing carries sentences too, and they are read before the owner sees them.**
The mockup's labels and captions are written by the designer and, until this was
added, read by nobody until the owner opened the contact sheet — which asks him to
approve wording as though he were the gate, which is the failure that produced this
agent in the first place. So the sheet goes to the reader before it goes to him, with
the designer's own inventory of every line on it. Say in the brief that the subject is labels
on a drawing — the agent's own contract says what that narrows the pass to, and
what happens to every placeholder on the sheet when nobody says it. Findings are fixed and the
sheet redrawn before it is shown — approval of wording that then changes is not
approval.

**The reading of the tables happens in stage 2, the moment they are written** — before render
code, specs or pictures are built on them. That is the whole economy of this gate: a
finding here edits one file, and the same finding at the end of the phase edits a
table, the code behind a sentence, the specs asserting it, and every poster drawing
it. The phase that introduced the gate ran it beside the pictures and paid twice, so
it moved ahead of them; the phase that measured it moved it again, all the way to the
artifact it reads.

At the end of the phase it runs a second time **only over what moved since** — keys
edited after the first reading. A phase that changed no copy after stage 2 owes
nothing here and says so in the commit.

**The site's pages are not the copy-reader's.** A page under `docs/` is written from
its fact tree in `docs/text/` by the `site-writer` agent, one language at a time and
never from the other language's page, and read by the `site-reader` agent, which is
given the built page and nothing else — no tree, no other language. The reader's
findings go back to the writer, not into the HTML by hand: seventy-three line-level
patches on one page left every sentence locally fine and the page still reading as a
translation. The pass ends when the reader returns no findings or the owner approves
the page. `docs-check` holds both languages to the tree — same blocks, same order,
same numbers, same commits — so structure is not the reader's question, only whether
a person would say it.

## What the owner rejected on the site

Both agents read this table before a line, and it is kept here, once, so his next
verdict has one place to land. Real lines from the Russian pages, his words verbatim.

| Shipped | His verdict |
|---|---|
| «Единственный пользователь харнеса — агент, и шесть недель ничего не строили так» | «это что такое? 😁» |
| «Агент plan-reviewer встал на другом конце фазы, в самом её начале» | «так не говорят» |
| «CI на теге может только доложить, но не удержать» | «это невозможно понять» |
| «Последний отрезок добавил мало новых частей. Он поправил то, как части узнают, что настал их черёд, и как харнес помнит, что делал.» | «очень слабый абзац, его невозможно понять» |
| «Когда фичи отгораживали друг от друга линтом, проект получил урок, который потом повторял чаще всех остальных. Первые две версии правила независимости не делали ничего…» | «с первого раза невозможно понять, про что абзац» |
| «Он разбирает схему базы в PLAN.md и сравнивает её с SQL… И он валит папку, где скопилось больше девяти файлов…» | «очень косноязычно, тяжело читать» |
| «Ещё две идеи тех же двух дней пережили всё, что было после. Первая — правило о том, какому документу принадлежит факт… Вторая — …» | «прям сложный для восприятия, много тире, всё в куче» |
| «новое умолчание проваливается не тем, что его применяют плохо, а тем, что его тихо не применяют» | «очень сложно с первого раза понять идею этой цитаты» |
| «Вместе с этим пришли первый гейт, на который не может ответить машина, и первая ревизия самого харнеса.» | «не пришли, а пришёл или появился» |
| «Потом стенд поставили на прикол» | «„на прикол“ на русском значит „шутка“» |
| «Эта страница написана по тому же правилу: каждое число в ней прочитано из git, а не по памяти.» | «лишнее предложение» |
| «эквивалента в ESLint не имеет и остаётся соглашением для ревью» | «задай себе вопрос „и что?“ — ну и ничего, значит можно убрать» |
| «Деплой и три неправильных lock-файла» | «не особо ключевой момент, просто деталь — такие можно и удалить, они только отвлекают» |
| «Счёт в дурака без бумажки.» — the landing's first title, August 2026 | «звучит как начало анекдота» |

And the paragraph he held up as the bar — *«вот это пример хорошего абзаца, легко
читается, интересно и по существу»*: *«Первая эпоха сделала правила проверяемыми…
„фича — это папка, которую можно удалить“. Проверили, удалив одну.»* One claim, one
proof, and the sentence ends where the point does.

Its third question is the one that pays for the gate twice: following a sentence back
to the rule that earns it has already caught a claim no rule guaranteed and two
arguments handed over in the wrong order. That question needs call sites, so at stage 2
it is asked against the frozen signatures, and any of it left unanswerable waits for
the second pass.

**Freeze the files before briefing a cold agent.** A reader starts by reading; if you
are still editing its subject, it reports on a tree that no longer exists and you
cannot tell which of its findings are stale. This has happened twice in one phase — a
reviewer watched one file change under it mid-pass and said so, and a copy reader had
to be sent back to re-read a table edited while it worked. Brief an agent on files you
will not touch until it returns, or wait. The same rule Stryker has, for the same
reason.
