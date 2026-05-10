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
            <a
              className='about-github-link about-github-link--top'
              href='https://github.com/kentbrought/block-code-comp'
              target='_blank'
              rel='noreferrer'
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
          <h2>References Informing the Design</h2>
          <p>
            This prototype draws from literature on generative AI in education, educational game
            design, and critical STEM/game design methods. It also uses a drawing-guessing
            pipeline inspired by the Quick, Draw dataset context for computer vision interactions.
          </p>
        </section>

        <div className='about-actions'>
          <button type='button' className='about-back-btn' onClick={onBack}>
            Back to Home
          </button>
          <a
            className='about-github-link'
            href='https://github.com/kentbrought/block-code-comp'
            target='_blank'
            rel='noreferrer'
          >
            {githubIcon} View on GitHub
          </a>
        </div>
      </main>
    </div>
  )
}

export default AboutPage
