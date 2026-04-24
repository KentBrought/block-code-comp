import React from 'react'
import './AboutPage.css'

const TEAM_MEMBERS = ['Kent', 'Shreya', 'Terry', 'Teresa']

function AboutPage({ onBack }) {
  return (
    <div className='about-page'>
      <div className='about-glow about-glow-1' />
      <div className='about-glow about-glow-2' />

      <main className='about-shell'>
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
            View on GitHub
          </a>
        </div>
      </main>
    </div>
  )
}

export default AboutPage
