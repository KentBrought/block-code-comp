import React, { useCallback, useEffect, useState } from 'react'
import './AboutPage.css'

const TEAM_MEMBERS = ['Kent', 'Shreya', 'Terry', 'Teresa']
const publicBase = process.env.PUBLIC_URL || ''

const githubIcon = (
  <svg aria-hidden='true' width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M12 .5A12 12 0 0 0 0 12.7c0 5.4 3.4 10 8.2 11.6.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.4-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12.2 12.2 0 0 0 24 12.7 12.2 12.2 0 0 0 12 .5Z' />
  </svg>
)

function AboutPage({ onBack }) {
  const [externalHref, setExternalHref] = useState(null)

  const openExternalPrompt = useCallback((event, href) => {
    if (!/^https?:\/\//i.test(href)) return
    event.preventDefault()
    setExternalHref(href)
  }, [])

  const closeExternalPrompt = useCallback(() => {
    setExternalHref(null)
  }, [])

  const confirmExternalOpen = useCallback(() => {
    if (externalHref) {
      window.open(externalHref, '_blank', 'noopener,noreferrer')
    }
    setExternalHref(null)
  }, [externalHref])

  useEffect(() => {
    if (!externalHref) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') closeExternalPrompt()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [externalHref, closeExternalPrompt])

  const ExternalTextLink = ({ href, children, className }) => (
    <a
      className={className}
      href={href}
      target='_blank'
      rel='noreferrer'
      onClick={(e) => openExternalPrompt(e, href)}
    >
      {children}
    </a>
  )

  return (
    <div className='about-page'>
      {externalHref && (
        <div
          className='about-redirect-overlay'
          role='presentation'
          onClick={closeExternalPrompt}
        >
          <div
            className='about-redirect-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='about-redirect-title'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id='about-redirect-title'>Leave this site?</h2>
            <p>You are about to open another website in a new tab.</p>
            <p className='about-redirect-url'>{externalHref}</p>
            <div className='about-redirect-actions'>
              <button type='button' className='about-back-btn' onClick={closeExternalPrompt}>
                Stay here
              </button>
              <button type='button' className='about-redirect-confirm' onClick={confirmExternalOpen}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='about-glow about-glow-1' />
      <div className='about-glow about-glow-2' />

      <main className='about-shell'>
        <header className='app-header about-app-header'>
          <h1
            className='app-title'
            onClick={onBack}
            style={{ cursor: 'pointer' }}
            title='Back to home'
          >
            <span className='title-block'>Block</span>
            <span className='title-comma'>,</span>{' '}
            <span className='title-code'>Code</span>
            <span className='title-comma'>,</span>{' '}
            <span className='title-draw'>Draw!</span>
          </h1>

          <div className='header-centre about-header-centre' />

          <div className='header-actions about-header-actions'>
            <a
              className='about-github-link about-github-link--top'
              href='https://github.com/kentbrought/block-code-comp'
              target='_blank'
              rel='noreferrer'
              onClick={(e) => openExternalPrompt(e, 'https://github.com/kentbrought/block-code-comp')}
            >
              {githubIcon} View on GitHub
            </a>
          </div>
        </header>

        <header className='about-hero'>
          <p className='about-kicker'>About This Project</p>
          <h1 className='about-title'>
            <span>Block</span>, <span>Code</span>, <span>Draw</span>
          </h1>
          <p className='about-subtitle'>
            Built by {TEAM_MEMBERS.join(', ')} for <strong>CMS.594 at MIT</strong>.
          </p>
        </header>

        <section className='about-card'>
          <h2>What This Is</h2>
          <p>
            Block, Code, Draw is a playful coding experience where learners use block-based programming
            to generate drawings and collaborate with AI. The core loop is simple: build a program, run
            it, inspect what happened, and revise.
          </p>
          <p>
            Our aim is to make early programming feel creative and approachable, especially for learners
            who may not yet feel ready for text-based code.
          </p>
          <p>
            In <strong>Main Play Mode</strong>, learners get an open sandbox to combine movement, loops,
            logic, and style blocks, then run and iterate quickly based on what they see. In{' '}
            <strong>Lessons Mode</strong>, that same creative process is scaffolded step by step so
            beginners can build confidence with sequence, loops, and conditions. In{' '}
            <strong>Challenge Mode</strong>, players apply those skills to hidden-target drawing goals
            that reward planning, testing, and tuning values until the output lines up.
          </p>
          <figure className='about-demo-wrap'>
            <img
              className='about-demo-gif'
              src={`${publicBase}/media/block-code-draw-demo.gif`}
              alt='Block, Code, Draw demo gameplay'
            />
            <figcaption>Gameplay demo: build with blocks, draw, and iterate with AI feedback.</figcaption>
          </figure>
        </section>

        <section className='about-card'>
          <h2>Local-First and Open Source</h2>
          <p>
            The app you load in your browser is the same code you can read on GitHub. The drawing
            checks, Blockly workspace, and most of the heavy lifting happen on your machine, not on
            our servers. That means we are not collecting your sketches or chat in a central database
            for this project, and you can run it offline once assets are cached.
          </p>
          <p>
            If you want to poke at the source or suggest a change, the repo is here:{' '}
            <ExternalTextLink href='https://github.com/kentbrought/block-code-comp' className='about-inline-link'>
              Block, Code, Comp!
            </ExternalTextLink>
            .
          </p>
        </section>

        <section className='about-card'>
          <h2>CMS.594 Context</h2>
          <p>
            This project was developed in CMS.594 Education Technology Studio in MIT Comparative Media
            Studies/Writing. The class centers on designing education technology through iterative
            prototyping, testing with users, and evidence-based revision.
          </p>
          <p>
            In our run of the course, the semester was split into three project phases. We focused on
            this same product through all three, using each phase to push the prototype further rather
            than switching topics: build a working core, test and improve the learning flow, and then
            harden the experience with better scaffolding and challenge design.
          </p>
          <img
            className='about-cms-mark'
            src={`${publicBase}/media/cmsw-logo-square.png`}
            alt='MIT Comparative Media Studies/Writing'
          />
        </section>

        <section className='about-card'>
          <h2>WebLLM and Llama in the Browser</h2>
          <p>
            One of the most useful parts of this project is that the bot runs in the browser with{' '}
            <ExternalTextLink href='https://webllm.mlc.ai/' className='about-inline-link'>
              WebLLM
            </ExternalTextLink>
            . Instead of requiring a cloud API call for every message, the model runs locally through
            WebGPU, which is the browser interface to the computer&apos;s graphics hardware. That design
            keeps the bot close to the coding canvas and makes feedback feel immediate during class use.
          </p>
          <p>
            MLC is what makes that feasible at this scale. It compiles models such as Llama into
            browser-ready artifacts so they can run efficiently on everyday hardware. Because the model
            runs locally, nothing about a student's work or conversation ever leaves the device, which
            is a meaningful privacy benefit compared to setups that route through external AI services.
          </p>
          <p>
            In this prototype we use{' '}
            <code>Llama-3.2-1B-Instruct-q4f32_1-MLC</code> for the bot replies next to the canvas. This
            is a compact Llama model that is small enough to deliver in-browser but still strong enough
            to give useful coding and drawing guidance as students iterate.
          </p>
          <figure className='about-inline-media about-inline-media--wide'>
            <img
              className='about-inline-image about-inline-image--svg'
              src={`${publicBase}/media/mlc-logo-with-text-landscape.svg`}
              alt='MLC logo'
            />
            <figcaption>Logo for MLC, the stack behind WebLLM.</figcaption>
          </figure>
          <p>
            If you want to dive deeper, the docs and code live on{' '}
            <ExternalTextLink href='https://github.com/mlc-ai/web-llm' className='about-inline-link'>
              mlc-ai/web-llm
            </ExternalTextLink>
            .
          </p>
        </section>

        <section className='about-card'>
          <h2>Quick Draw Data and Ghost Guidance</h2>
          <p>
            In challenge mode, secret words can show a dashed ghost preview generated from
            real{' '}
            <ExternalTextLink href='https://experiments.withgoogle.com/quick-draw' className='about-inline-link'>
              Quick, Draw!
            </ExternalTextLink>
            {' '}strokes. This data is based on freehand human sketches, so it is naturally
            messy and varied. But because those sketches are still line drawings, they are especially
            useful training context for a line-based guessing experience like ours.
          </p>
          <figure className='about-demo-wrap about-demo-wrap--tight'>
            <img
              className='about-demo-gif about-demo-gif--contain'
              src={`${publicBase}/media/quickdraw-shareimg.png`}
              alt='Quick Draw promotional graphic'
            />
          </figure>
          <p>
            Raw Quick, Draw! strokes can be noisy and dense, so our preview pipeline applies simplification
            before rendering. In code, each stroke is converted to points, nearly straight strokes are
            collapsed to endpoints, and non-straight strokes are simplified with Ramer-Douglas-Peucker.
            We then normalize the result into a fixed box for consistent display.
          </p>
          <p>
            The key reason we do this is gameplay fit: pure freehand traces can include tiny wiggles and
            micro-jitter that are hard to reproduce with block commands. Simplifying the strokes makes the
            ghost target closer to what users can realistically build with motion blocks, while still
            preserving the recognizable structure of the original doodle.
          </p>
          <p>
            The vision guesser works on the finished drawing image and predicts which known class it most
            resembles, returning ranked label candidates. So it is not checking for one perfect tracing;
            it is estimating which doodle category your drawing most likely matches.
          </p>
          <figure className='about-demo-wrap'>
            <img
              className='about-demo-gif'
              src={`${publicBase}/media/quickdraw-dataset-preview.jpg`}
              alt='Collage of Quick Draw doodles from the public dataset'
            />
            <figcaption>Examples of the kinds of doodles the public dataset contains.</figcaption>
          </figure>
          <p>
            Curious about the data itself? Start with{' '}
            <ExternalTextLink href='https://quickdraw.withgoogle.com/data' className='about-inline-link'>
              Google&apos;s Quick, Draw! dataset page
            </ExternalTextLink>
            .
          </p>
        </section>

        <section className='about-card'>
          <h2>Twemoji</h2>
          <p>
            Twemoji is a great fit for this project because it keeps emoji visuals consistent across
            operating systems and devices. Without a shared set, the same emoji can look very different
            from one machine to another. Twemoji gives us one clear, reliable style for blocks and UI
            cues.
          </p>
          <p>
            If you want to check out the project itself:{' '}
            <ExternalTextLink href='https://github.com/twitter/twemoji' className='about-inline-link'>
              twitter/twemoji on GitHub
            </ExternalTextLink>
            .
          </p>
          <figure className='about-inline-media'>
            <img
              className='about-inline-image'
              src={`${publicBase}/media/twemoji-repo-card.png`}
              alt='Twemoji repository preview card'
            />
            <figcaption>GitHub preview card for the Twemoji repo.</figcaption>
          </figure>
        </section>

        <section className='about-card'>
          <h2>References Informing the Design</h2>
          <p>
            This prototype draws from literature on generative AI in education, educational game design,
            and critical STEM/game design methods. It also uses a drawing-guessing pipeline inspired by
            the Quick, Draw dataset context for computer vision interactions.
          </p>
        </section>

        <div className='about-actions'>
          <button type='button' className='about-back-btn' onClick={onBack}>
            Back to Home
          </button>
        </div>
      </main>
    </div>
  )
}

export default AboutPage
