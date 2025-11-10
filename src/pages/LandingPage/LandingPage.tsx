import React from 'react'
import Hero from '../../components/Hero/Hero'
import HowItWorks from '../../components/HowItWorks'
import JoinBookCycle from '../../components/JoinBookCycle/JoinBookCycle'
import './LandingPage.css'

const LandingPage: React.FC = () => {
  const testimonials = [
    {
      text:
        'Arka has transformed the way I read books. I love being part of this eco-friendly community!',
      author: 'Alex T.',
    },
    {
      text:
        "The waste paper pickup service is fantastic. It's convenient and great for the environment.",
      author: 'Jamie L.',
    },
    {
      text:
        "I've discovered so many new books through Arka. It's a wonderful initiative!",
      author: 'Morgan S.',
    },
  ]

  return (
    <div className="landing-page">
      <Hero />
      <HowItWorks />
      <section className="testimonials">
        <div className="lp-container">
          <h2 className="testimonials-title">Testimonials</h2>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <p className="testimonial-text">"{t.text}"</p>
                <p className="testimonial-author">- {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <JoinBookCycle />
    </div>
  )
}

export default LandingPage
