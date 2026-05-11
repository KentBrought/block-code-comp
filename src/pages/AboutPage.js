import React from 'react'
import './AboutPage.css'

const TEAM_MEMBERS = ['Kent', 'Shreya', 'Terry', 'Teresa']
const githubIcon = (
  <svg
    aria-hidden='true'
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='currentColor'
  >
    <path d='M12 .5A12 12 0 0 0 0 12.7c0 5.4 3.4 10 8.2 11.6.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.4-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12.2 12.2 0 0 0 24 12.7 12.2 12.2 0 0 0 12 .5Z' />
  </svg>
)

function ConfirmExternalLink({ href, children, className }) {
  const handleClick = (event) => {
    const isExternal = /^https?:\/\//i.test(href)
    if (!isExternal) return
    event.preventDefault()
    const approved = window.confirm(`You are leaving Block, Code, Draw.\n\nOpen this external link?\n${href}`)
    if (approved) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <a className={className} href={href} target='_blank' rel='noreferrer' onClick={handleClick}>
      {children}
    </a>
  )
}

function AboutPage({ onBack }) {
  return (
    <div className='about-page'>
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
            <ConfirmExternalLink
              className='about-github-link about-github-link--top'
              href='https://github.com/kentbrought/block-code-comp'
            >
              {githubIcon} View on GitHub
            </ConfirmExternalLink>
          </div>
        </header>

        <header className='about-hero'>
          <p className='about-kicker'>About This Project</p>
          <h1 className='about-title'>
            <span>Block</span>, <span>Code</span>, <span>Draw</span>
          </h1>
          <p className='about-subtitle'>
            Created by {TEAM_MEMBERS.join(', ')} for <strong>CMS.594 at MIT</strong>.
          </p>
        </header>

        <section className='about-card'>
          <h2>What This Is</h2>
          <p>
            Block, Code, Draw is a playful coding experience where learners use block-based
            programming to generate drawings and collaborate with AI. The core loop is simple:
            build a program, run it, inspect what happened, and revise.
          </p>
          <p>
            Our aim is to make early programming feel creative and approachable, especially for
            learners who may not yet feel ready for text-based code.
          </p>
          <figure className='about-demo-wrap'>
            <img
              className='about-demo-gif'
              src={`${process.env.PUBLIC_URL}/media/block-code-draw-demo.gif`}
              alt='Block, Code, Draw demo gameplay'
            />
            <figcaption>Gameplay demo: build with blocks, draw, and iterate with AI feedback.</figcaption>
          </figure>
        </section>

        <section className='about-card'>
          <h2>CMS.594 Context</h2>
          <p>
            This project was developed in the context of CMS.594 in MIT Comparative Media
            Studies, where teams prototype interactive learning experiences, test them with users,
            and iterate based on evidence.
          </p>
          <p>
            For this prototype, our team focused on balancing engagement and learning:
            introducing enough challenge to build real problem-solving skills while keeping the
            experience welcoming for beginners.
          </p>
        </section>

        <section className='about-card'>
          <h2>AI + Model Stack (Runs Locally)</h2>
          <p>
            The chat helper runs with <strong>WebLLM</strong> using{' '}
            <code>Llama-3.2-1B-Instruct-q4f32_1-MLC</code>. The model is downloaded to the
            browser and inference runs on the learner&apos;s device with WebGPU acceleration.
          </p>
          <p>
            We also run the drawing evaluation pipeline fully in-browser. The app compares user
            strokes to a ghost target using an on-canvas pixel overlap scorer, so no drawing
            images need to be sent to a remote server for challenge checking.
          </p>
          <ul className='about-links'>
            <li>
              <ConfirmExternalLink href='https://webllm.mlc.ai/' className='about-inline-link'>
                WebLLM project
              </ConfirmExternalLink>
            </li>
            <li>
              <ConfirmExternalLink href='https://github.com/mlc-ai/web-llm' className='about-inline-link'>
                @mlc-ai/web-llm source
              </ConfirmExternalLink>
            </li>
            <li>
              <ConfirmExternalLink href='https://huggingface.co/mlc-ai' className='about-inline-link'>
                MLC model hub (Llama variants)
              </ConfirmExternalLink>
            </li>
          </ul>
        </section>

        <section className='about-card'>
          <h2>Quick Draw Data + Why Lines Look Hand-Drawn</h2>
          <p>
            Word previews are based on Google Quick, Draw! stroke data. We simplify those vectors,
            but they still come from real human sketches, which is why some previews are naturally
            imperfect and not all straight-line geometry.
          </p>
          <p>
            The app keeps a local generated preview set for performance and reliability, instead of
            downloading examples every time the word picker opens.
          </p>
          <figure className='about-demo-wrap'>
            <img
              className='about-demo-gif'
              src='https://raw.githubusercontent.com/googlecreativelab/quickdraw-dataset/master/examples/apple.png'
              alt='Example Quick Draw sketch from public dataset assets'
            />
            <figcaption>
              Public Quick Draw example asset (source link below).
            </figcaption>
          </figure>
          <ul className='about-links'>
            <li>
              <ConfirmExternalLink href='https://quickdraw.withgoogle.com/data' className='about-inline-link'>
                Quick, Draw! dataset page
              </ConfirmExternalLink>
            </li>
            <li>
              <ConfirmExternalLink href='https://github.com/googlecreativelab/quickdraw-dataset' className='about-inline-link'>
                quickdraw-dataset GitHub repository
              </ConfirmExternalLink>
            </li>
            <li>
              <ConfirmExternalLink href='https://raw.githubusercontent.com/googlecreativelab/quickdraw-dataset/master/examples/apple.png' className='about-inline-link'>
                Example asset used above
              </ConfirmExternalLink>
            </li>
          </ul>
        </section>

        <section className='about-card'>
          <h2>Twemoji + Visual Assets</h2>
          <p>
            Pointer styles and chat/persona emoji visuals use Twemoji assets, so emojis render
            consistently across devices in both the canvas and block UI.
          </p>
          <ul className='about-links'>
            <li>
              <ConfirmExternalLink href='https://twemoji.twitter.com/' className='about-inline-link'>
                Twemoji project site
              </ConfirmExternalLink>
            </li>
            <li>
              <ConfirmExternalLink href='https://github.com/twitter/twemoji' className='about-inline-link'>
                Twemoji GitHub repository
              </ConfirmExternalLink>
            </li>
          </ul>
        </section>

        <section className='about-card'>
          <h2>References Informing the Design</h2>
          <p>
            This prototype draws from literature on generative AI in education, educational game
            design, and critical STEM/game design methods, while prioritizing local-first
            interaction for responsiveness and privacy.
          </p>
        </section>

        <div className='about-actions'>
          <button type='button' className='about-back-btn' onClick={onBack}>
            Back to Home
          </button>
          <ConfirmExternalLink
            className='about-github-link'
            href='https://github.com/kentbrought/block-code-comp'
          >
            {githubIcon} View on GitHub
          </ConfirmExternalLink>
        </div>
      </main>
    </div>
  )
}

export default AboutPage
