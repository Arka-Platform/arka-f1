'use client'

import React, { useState } from 'react'
import styles from './HowItWorks.module.css'

interface LifecycleFlow {
  title: string
  color: string
  steps: {
    title: string
    description: string
    icon: React.ReactNode
  }[]
}

const HowItWorks: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true)

  const flows: LifecycleFlow[] = [
    {
      title: 'Sell',
      color: '#4A90E2',
      steps: [
        {
          title: 'Snap & List',
          description: 'Take a photo of your book and list it in our platform.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              {/* Camera/Phone */}
              <rect x="30" y="25" width="40" height="50" fill="#4A90E2" rx="5" />
              <circle cx="50" cy="40" r="8" fill="#2E5C8A" />
              <circle cx="50" cy="40" r="5" fill="#5BA3F5" />
              <rect x="45" y="60" width="10" height="8" fill="#2E5C8A" rx="2" />
              {/* Flash icon */}
              <path d="M 50 20 L 52 25 L 50 25 L 48 25 Z" fill="#FFD700" />
            </svg>
          ),
        },
        {
          title: 'Handover Upon Request',
          description: 'When someone buys your book, hand it over as requested. We coordinate the pickup.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <rect x="30" y="40" width="40" height="30" fill="#4A90E2" rx="3" />
              <rect x="35" y="45" width="30" height="20" fill="#2E5C8A" rx="2" />
              <path d="M 50 30 L 45 40 L 55 40 Z" fill="#4A90E2" />
            </svg>
          ),
        },
        {
          title: 'Get Paid',
          description: 'Receive secure payment directly to your account when your book sells.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <circle cx="50" cy="50" r="35" fill="#50C878" />
              <path d="M 35 50 L 45 60 L 65 40" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="75" r="12" fill="#FFD700" />
              <text x="50" y="80" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">₹</text>
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Buy',
      color: '#50C878',
      steps: [
        {
          title: 'Browse',
          description: 'Explore thousands of affordable books across all genres.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <rect x="20" y="20" width="60" height="60" fill="#50C878" rx="5" />
              <circle cx="35" cy="35" r="3" fill="#2E7D32" />
              <circle cx="50" cy="35" r="3" fill="#2E7D32" />
              <circle cx="65" cy="35" r="3" fill="#2E7D32" />
              <line x1="25" y1="50" x2="75" y2="50" stroke="#2E7D32" strokeWidth="2" />
              <line x1="25" y1="60" x2="70" y2="60" stroke="#2E7D32" strokeWidth="2" />
              <line x1="25" y1="70" x2="75" y2="70" stroke="#2E7D32" strokeWidth="2" />
            </svg>
          ),
        },
        {
          title: 'Order',
          description: 'Get this book and checkout securely with multiple payment options.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <circle cx="50" cy="50" r="30" fill="#50C878" />
              <path d="M 35 50 L 45 60 L 65 40" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ),
        },
        {
          title: 'Receive',
          description: 'Get your book delivered to your doorstep with eco-friendly packaging.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <rect x="30" y="40" width="40" height="30" fill="#50C878" rx="3" />
              <rect x="35" y="45" width="30" height="20" fill="#2E7D32" rx="2" />
              <path d="M 50 30 L 45 40 L 55 40 Z" fill="#50C878" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Exchange',
      color: '#9C27B0',
      steps: [
        {
          title: 'Browse',
          description: 'Browse available books for exchange. Find books you want to read.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              <rect x="20" y="20" width="60" height="60" fill="#9C27B0" rx="5" />
              <circle cx="35" cy="35" r="3" fill="#6A1B9A" />
              <circle cx="50" cy="35" r="3" fill="#6A1B9A" />
              <circle cx="65" cy="35" r="3" fill="#6A1B9A" />
              <line x1="25" y1="50" x2="75" y2="50" stroke="#6A1B9A" strokeWidth="2" />
              <line x1="25" y1="60" x2="70" y2="60" stroke="#6A1B9A" strokeWidth="2" />
              <line x1="25" y1="70" x2="75" y2="70" stroke="#6A1B9A" strokeWidth="2" />
            </svg>
          ),
        },
        {
          title: 'Exchange',
          description: 'Request an exchange. Offer your book in return for the one you want.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              {/* Two arrows pointing in opposite directions */}
              <path d="M 30 50 L 50 35 M 50 35 L 50 30 M 50 35 L 45 40" stroke="#9C27B0" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 70 50 L 50 65 M 50 65 L 50 70 M 50 65 L 55 60" stroke="#9C27B0" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Books */}
              <rect x="25" y="40" width="12" height="20" fill="#9C27B0" rx="2" />
              <rect x="63" y="40" width="12" height="20" fill="#9C27B0" rx="2" />
            </svg>
          ),
        },
        {
          title: 'Expand',
          description: 'Expand your knowledge.',
          icon: (
            <svg viewBox="0 0 100 100" className={styles.stepIcon} aria-hidden="true">
              {/* Expanding circles or books */}
              <rect x="30" y="30" width="15" height="20" fill="#9C27B0" rx="2" />
              <rect x="50" y="35" width="15" height="20" fill="#BA68C8" rx="2" />
              <rect x="35" y="55" width="15" height="20" fill="#9C27B0" rx="2" />
              <rect x="55" y="50" width="15" height="20" fill="#BA68C8" rx="2" />
              {/* Plus sign */}
              <path d="M 45 40 L 45 50 M 40 45 L 50 45" stroke="#6A1B9A" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
        },
      ],
    },
  ]

  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        <button
          className={styles.sectionHeader}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="how-it-works-content"
        >
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <svg
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isExpanded && (
          <div id="how-it-works-content" className={styles.flowsContainer}>
            {flows.map((flow, flowIndex) => {
              const isBuyFlow = flow.title === 'Buy'
              
              return (
                <div key={flowIndex} className={styles.flow}>
                  <h3 className={styles.flowTitle} style={{ color: flow.color }}>
                    {flow.title}
                  </h3>
                  <div className={`${styles.flowContent} ${isBuyFlow ? styles.flowContentReversed : ''}`}>
                    {/* Steps text - left for Sell/Recycle, right for Buy */}
                    <div className={`${styles.stepsList} ${isBuyFlow ? styles.stepsListRight : ''}`}>
                      {flow.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className={styles.stepItem}>
                          <div className={styles.stepNumber} style={{ color: flow.color }}>
                            {stepIndex + 1}
                          </div>
                          <div className={styles.stepText}>
                            <h4 className={styles.stepTitle} style={{ color: flow.color }}>
                              {step.title}
                            </h4>
                            <p className={styles.stepDescription}>{step.description}</p>
                          </div>
                          {stepIndex < flow.steps.length - 1 && (
                            <div className={styles.stepArrow} style={{ color: flow.color }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Animation - right for Sell/Recycle, left for Buy */}
                    <div className={`${styles.animationContainer} ${isBuyFlow ? styles.animationContainerLeft : ''}`}>
                      <div className={styles.animatedBookIcon}>
                        {flow.title === 'Sell' && (
                          <svg viewBox="0 0 500 500" className={styles.animationIcon} aria-hidden="true">
                            {/* Character (person) */}
                            <g className={styles.character}>
                              {/* Head */}
                              <circle cx="150" cy="120" r="25" fill="#FFDBAC" />
                              {/* Face details */}
                              <circle cx="142" cy="115" r="2" fill="#1a1a1a" />
                              <circle cx="158" cy="115" r="2" fill="#1a1a1a" />
                              <path d="M 142 125 Q 150 130 158 125" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
                              {/* Body */}
                              <rect x="130" y="145" width="40" height="80" fill="#4A90E2" rx="5" />
                              {/* Arms */}
                              <g className={styles.characterArms}>
                                <rect x="110" y="155" width="20" height="8" fill="#FFDBAC" rx="4" />
                                <rect x="170" y="155" width="20" height="8" fill="#FFDBAC" rx="4" />
                              </g>
                              {/* Legs */}
                              <rect x="135" y="225" width="12" height="50" fill="#2E5C8A" rx="3" />
                              <rect x="153" y="225" width="12" height="50" fill="#2E5C8A" rx="3" />
                            </g>

                            {/* Book (being placed) */}
                            <g className={styles.bookPlacing}>
                              {/* Book cover - front */}
                              <rect x="120" y="150" width="50" height="60" fill="#4A90E2" rx="2" />
                              {/* Book spine */}
                              <rect x="120" y="150" width="8" height="60" fill="#2E5C8A" />
                              {/* Book pages */}
                              <rect x="128" y="152" width="42" height="56" fill="#F5F5F5" rx="1" />
                              {/* Text lines on pages */}
                              <line x1="135" y1="165" x2="165" y2="165" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="135" y1="175" x2="165" y2="175" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="135" y1="185" x2="160" y2="185" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="135" y1="195" x2="165" y2="195" stroke="#E0E0E0" strokeWidth="1.5" />
                              {/* Book title area */}
                              <rect x="130" y="155" width="40" height="8" fill="#5BA3F5" opacity="0.3" rx="1" />
                            </g>

                            {/* Box */}
                            <g className={styles.box}>
                              <rect x="200" y="280" width="100" height="80" fill="#8B4513" rx="4" />
                              <rect x="205" y="285" width="90" height="70" fill="#A0522D" rx="2" />
                              {/* Box lid */}
                              <rect x="195" y="275" width="110" height="15" fill="#654321" rx="2" />
                              {/* Box tape */}
                              <rect x="240" y="280" width="20" height="80" fill="#FFD700" opacity="0.6" />
                            </g>

                            {/* Book inside box */}
                            <g className={styles.bookInBox}>
                              {/* Book cover - front */}
                              <rect x="210" y="285" width="45" height="55" fill="#4A90E2" rx="2" />
                              {/* Book spine */}
                              <rect x="210" y="285" width="6" height="55" fill="#2E5C8A" />
                              {/* Book pages */}
                              <rect x="216" y="287" width="39" height="51" fill="#F5F5F5" rx="1" />
                              {/* Text lines on pages */}
                              <line x1="220" y1="298" x2="250" y2="298" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="220" y1="305" x2="250" y2="305" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="220" y1="312" x2="245" y2="312" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="220" y1="319" x2="250" y2="319" stroke="#E0E0E0" strokeWidth="1" />
                              {/* Book title area */}
                              <rect x="215" y="290" width="35" height="6" fill="#5BA3F5" opacity="0.3" rx="1" />
                            </g>

                            {/* Courier truck */}
                            <g className={styles.courierTruck}>
                              {/* Truck body */}
                              <rect x="320" y="300" width="120" height="60" fill="#FF6B6B" rx="5" />
                              {/* Truck cabin */}
                              <rect x="320" y="280" width="50" height="40" fill="#FF5252" rx="3" />
                              {/* Truck window */}
                              <rect x="325" y="285" width="40" height="25" fill="#E3F2FD" rx="2" />
                              {/* Truck wheels */}
                              <circle cx="340" cy="365" r="15" fill="#1a1a1a" />
                              <circle cx="340" cy="365" r="10" fill="#333" />
                              <circle cx="420" cy="365" r="15" fill="#1a1a1a" />
                              <circle cx="420" cy="365" r="10" fill="#333" />
                              {/* Truck details */}
                              <rect x="370" y="305" width="65" height="50" fill="#FF5252" rx="3" />
                            </g>

                            {/* Rupee popping out */}
                            <g className={styles.rupeePop}>
                              <circle cx="380" cy="200" r="50" fill="#FFD700" />
                              <circle cx="380" cy="200" r="45" fill="#FFED4E" opacity="0.8" />
                              <text x="380" y="220" textAnchor="middle" fill="#1a1a1a" fontSize="60" fontWeight="bold" fontFamily="Arial, sans-serif">₹</text>
                            </g>

                            {/* Sparkle effects */}
                            <circle cx="400" cy="170" r="8" fill="#FFD700" className={styles.sparkle1} />
                            <circle cx="425" cy="200" r="6" fill="#FFD700" className={styles.sparkle2} />
                            <circle cx="390" cy="230" r="6" fill="#FFD700" className={styles.sparkle3} />
                            <circle cx="410" cy="160" r="4" fill="#FFED4E" className={styles.sparkle1} />
                            <circle cx="430" cy="210" r="5" fill="#FFED4E" className={styles.sparkle2} />
                          </svg>
                        )}
                        
                        {flow.title === 'Buy' && (
                          <svg viewBox="0 0 500 500" className={styles.animationIcon} aria-hidden="true">
                            {/* Person receiving book */}
                            <g className={styles.buyCharacter}>
                              {/* Head */}
                              <circle cx="250" cy="200" r="30" fill="#FFDBAC" />
                              {/* Body */}
                              <rect x="225" y="230" width="50" height="100" fill="#50C878" rx="5" />
                              {/* Arms - holding book */}
                              <g className={styles.buyCharacterArms}>
                                <rect x="200" y="240" width="25" height="10" fill="#FFDBAC" rx="5" />
                                <rect x="275" y="240" width="25" height="10" fill="#FFDBAC" rx="5" />
                              </g>
                              {/* Legs */}
                              <rect x="230" y="330" width="15" height="60" fill="#2E7D32" rx="3" />
                              <rect x="255" y="330" width="15" height="60" fill="#2E7D32" rx="3" />
                            </g>

                            {/* Delivery package arriving */}
                            <g className={styles.deliveryPackage}>
                              <rect x="150" y="350" width="100" height="80" fill="#8B4513" rx="4" />
                              <rect x="155" y="355" width="90" height="70" fill="#A0522D" rx="2" />
                              <rect x="145" y="345" width="110" height="15" fill="#654321" rx="2" />
                              <rect x="190" y="350" width="20" height="80" fill="#FFD700" opacity="0.6" />
                            </g>

                            {/* Book being delivered from package */}
                            <g className={styles.bookDelivering}>
                              {/* Book cover */}
                              <rect x="160" y="355" width="45" height="55" fill="#50C878" rx="2" />
                              {/* Book spine */}
                              <rect x="160" y="355" width="6" height="55" fill="#2E7D32" />
                              {/* Book pages */}
                              <rect x="166" y="357" width="39" height="51" fill="#F5F5F5" rx="1" />
                              {/* Text lines */}
                              <line x1="170" y1="368" x2="200" y2="368" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="170" y1="375" x2="200" y2="375" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="170" y1="382" x2="195" y2="382" stroke="#E0E0E0" strokeWidth="1" />
                              <line x1="170" y1="389" x2="200" y2="389" stroke="#E0E0E0" strokeWidth="1" />
                            </g>

                            {/* Book in person's hands - opening */}
                            <g className={styles.bookInHands}>
                              {/* Book cover - left page */}
                              <rect x="220" y="220" width="30" height="70" fill="#50C878" rx="2" />
                              <rect x="220" y="220" width="5" height="70" fill="#2E7D32" />
                              {/* Book cover - right page (opening) */}
                              <rect x="250" y="220" width="30" height="70" fill="#50C878" rx="2" className={styles.bookOpening} />
                              {/* Book pages - left */}
                              <rect x="225" y="222" width="25" height="66" fill="#F5F5F5" rx="1" />
                              {/* Book pages - right (opening) */}
                              <rect x="255" y="222" width="25" height="66" fill="#F5F5F5" rx="1" className={styles.bookOpening} />
                              {/* Text lines on left page */}
                              <line x1="228" y1="235" x2="248" y2="235" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="228" y1="245" x2="248" y2="245" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="228" y1="255" x2="245" y2="255" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="228" y1="265" x2="248" y2="265" stroke="#E0E0E0" strokeWidth="1.5" />
                              {/* Text lines on right page */}
                              <line x1="258" y1="235" x2="278" y2="235" stroke="#E0E0E0" strokeWidth="1.5" className={styles.bookOpening} />
                              <line x1="258" y1="245" x2="278" y2="245" stroke="#E0E0E0" strokeWidth="1.5" className={styles.bookOpening} />
                              <line x1="258" y1="255" x2="275" y2="255" stroke="#E0E0E0" strokeWidth="1.5" className={styles.bookOpening} />
                              <line x1="258" y1="265" x2="278" y2="265" stroke="#E0E0E0" strokeWidth="1.5" className={styles.bookOpening} />
                            </g>

                            {/* Pages turning effect */}
                            <g className={styles.pagesTurning}>
                              {/* Page turning */}
                              <path d="M 250 220 L 250 290 L 270 280 L 270 230 Z" fill="#F5F5F5" opacity="0.8" className={styles.turningPage} />
                              <line x1="255" y1="240" x2="268" y2="238" stroke="#E0E0E0" strokeWidth="1" className={styles.turningPage} />
                              <line x1="255" y1="250" x2="268" y2="248" stroke="#E0E0E0" strokeWidth="1" className={styles.turningPage} />
                            </g>

                            {/* Joyful sparkles around the book */}
                            <g className={styles.joySparkles}>
                              <circle cx="200" cy="200" r="6" fill="#FFD700" className={styles.joySparkle1} />
                              <circle cx="300" cy="200" r="5" fill="#50C878" className={styles.joySparkle2} />
                              <circle cx="220" cy="180" r="5" fill="#FFD700" className={styles.joySparkle3} />
                              <circle cx="280" cy="180" r="6" fill="#50C878" className={styles.joySparkle4} />
                              <circle cx="240" cy="160" r="4" fill="#FFD700" className={styles.joySparkle5} />
                              <circle cx="260" cy="160" r="5" fill="#50C878" className={styles.joySparkle6} />
                            </g>

                            {/* Reading glow effect */}
                            <g className={styles.readingGlow}>
                              <circle cx="250" cy="255" r="60" fill="#50C878" opacity="0.1" />
                              <circle cx="250" cy="255" r="50" fill="#50C878" opacity="0.15" />
                              <circle cx="250" cy="255" r="40" fill="#50C878" opacity="0.2" />
                            </g>

                            {/* Happy expression on person */}
                            <g className={styles.happyFace}>
                              {/* Smile */}
                              <path d="M 235 210 Q 250 220 265 210" stroke="#2E7D32" strokeWidth="3" fill="none" strokeLinecap="round" className={styles.smile} />
                              {/* Eyes */}
                              <circle cx="240" cy="200" r="3" fill="#2E7D32" />
                              <circle cx="260" cy="200" r="3" fill="#2E7D32" />
                            </g>
                          </svg>
                        )}

                        {flow.title === 'Exchange' && (
                          <svg viewBox="0 0 500 500" className={styles.animationIcon} aria-hidden="true">
                            {/* Customer - left side */}
                            <g className={styles.exchangeCustomer}>
                              {/* Head */}
                              <circle cx="150" cy="200" r="30" fill="#FFDBAC" />
                              {/* Face details */}
                              <circle cx="142" cy="195" r="2.5" fill="#1a1a1a" />
                              <circle cx="158" cy="195" r="2.5" fill="#1a1a1a" />
                              <path d="M 142 205 Q 150 210 158 205" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
                              {/* Body */}
                              <rect x="130" y="230" width="40" height="100" fill="#9C27B0" rx="5" />
                              {/* Arms */}
                              <g className={styles.customerArms}>
                                <rect x="110" y="240" width="20" height="10" fill="#FFDBAC" rx="5" />
                                <rect x="170" y="240" width="20" height="10" fill="#FFDBAC" rx="5" />
                              </g>
                              {/* Legs */}
                              <rect x="135" y="330" width="12" height="60" fill="#6A1B9A" rx="3" />
                              <rect x="153" y="330" width="12" height="60" fill="#6A1B9A" rx="3" />
                            </g>

                            {/* Delivery person - right side */}
                            <g className={styles.exchangeDeliveryPerson}>
                              {/* Head */}
                              <circle cx="350" cy="200" r="30" fill="#FFDBAC" />
                              {/* Face details */}
                              <circle cx="342" cy="195" r="2" fill="#1a1a1a" />
                              <circle cx="358" cy="195" r="2" fill="#1a1a1a" />
                              <path d="M 342 205 Q 350 210 358 205" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
                              {/* Delivery cap - professional */}
                              <rect x="318" y="162" width="64" height="28" fill="#1a1a1a" rx="5" />
                              <rect x="328" y="168" width="44" height="14" fill="#FFD700" rx="2" />
                              <rect x="333" y="170" width="34" height="10" fill="#1a1a1a" rx="1" />
                              {/* Cap logo/text */}
                              <text x="350" y="178" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">ARKA</text>
                              
                              {/* Body - delivery uniform shirt */}
                              <rect x="328" y="228" width="44" height="102" fill="#FF6B6B" rx="6" />
                              {/* Shirt collar */}
                              <path d="M 340 228 L 350 235 L 360 228" stroke="#1a1a1a" strokeWidth="2" fill="none" />
                              {/* Delivery badge/logo on shirt - more detailed */}
                              <circle cx="350" cy="258" r="10" fill="#FFD700" stroke="#1a1a1a" strokeWidth="1.5" />
                              <circle cx="350" cy="258" r="6" fill="#1a1a1a" />
                              <text x="350" y="262" textAnchor="middle" fill="#FFD700" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">A</text>
                              {/* Name tag */}
                              <rect x="342" y="270" width="16" height="8" fill="#FFD700" rx="1" />
                              <line x1="342" y1="274" x2="358" y2="274" stroke="#1a1a1a" strokeWidth="0.5" />
                              {/* Shirt pocket */}
                              <rect x="340" y="285" width="20" height="12" fill="#FF5252" rx="1" stroke="#1a1a1a" strokeWidth="1" />
                              
                              {/* Delivery bag - professional messenger bag */}
                              <g className={styles.deliveryBag}>
                                {/* Bag body - main */}
                                <rect x="358" y="238" width="58" height="68" fill="#2A2A2A" rx="4" />
                                <rect x="362" y="242" width="50" height="60" fill="#1a1a1a" rx="3" />
                                {/* Bag strap - adjustable */}
                                <path d="M 358 238 Q 368 215 378 238" stroke="#1a1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <path d="M 358 238 Q 368 220 378 238" stroke="#4A4A4A" strokeWidth="3" fill="none" strokeLinecap="round" />
                                {/* Bag flap with logo */}
                                <rect x="360" y="238" width="54" height="12" fill="#1a1a1a" rx="3" />
                                <rect x="365" y="241" width="44" height="6" fill="#FFD700" rx="1" />
                                {/* Bag buckle/clasp - more detailed */}
                                <rect x="400" y="242" width="8" height="6" fill="#FFD700" rx="1" />
                                <circle cx="404" cy="245" r="2" fill="#1a1a1a" />
                                {/* Bag side pocket */}
                                <rect x="408" y="250" width="6" height="20" fill="#2A2A2A" rx="1" />
                                {/* Books inside bag (visible through opening) */}
                                <rect x="368" y="250" width="18" height="24" fill="#9C27B0" rx="1" />
                                <rect x="390" y="255" width="18" height="24" fill="#BA68C8" rx="1" />
                                {/* Bag handle */}
                                <rect x="365" y="240" width="12" height="4" fill="#4A4A4A" rx="2" />
                              </g>
                              
                              {/* Arms - more realistic */}
                              <g className={styles.deliveryArms}>
                                {/* Left arm */}
                                <rect x="308" y="240" width="22" height="12" fill="#FFDBAC" rx="6" />
                                <rect x="310" y="252" width="18" height="8" fill="#FF6B6B" rx="4" />
                                {/* Right arm - holding bag strap */}
                                <rect x="370" y="240" width="22" height="12" fill="#FFDBAC" rx="6" />
                                <rect x="372" y="252" width="18" height="8" fill="#FF6B6B" rx="4" />
                              </g>
                              
                              {/* Legs - delivery pants with pockets */}
                              <rect x="333" y="328" width="14" height="62" fill="#1a1a1a" rx="3" />
                              <rect x="353" y="328" width="14" height="62" fill="#1a1a1a" rx="3" />
                              {/* Pants pockets */}
                              <path d="M 335 340 L 340 340 L 340 350 L 335 350 Z" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                              <path d="M 355 340 L 360 340 L 360 350 L 355 350 Z" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                              
                              {/* Shoes - work boots */}
                              <rect x="331" y="388" width="18" height="10" fill="#333" rx="3" />
                              <rect x="351" y="388" width="18" height="10" fill="#333" rx="3" />
                              {/* Boot laces */}
                              <line x1="335" y1="390" x2="345" y2="390" stroke="#1a1a1a" strokeWidth="1" />
                              <line x1="355" y1="390" x2="365" y2="390" stroke="#1a1a1a" strokeWidth="1" />
                              
                              {/* Delivery device/phone in hand */}
                              <g className={styles.deliveryDevice}>
                                <rect x="312" y="245" width="12" height="18" fill="#1a1a1a" rx="2" />
                                <rect x="313" y="246" width="10" height="16" fill="#2A2A2A" rx="1" />
                                <circle cx="318" cy="252" r="1.5" fill="#50C878" />
                                <rect x="315" y="256" width="6" height="4" fill="#4A4A4A" rx="1" />
                              </g>
                            </g>

                            {/* Customer's book - being given */}
                            <g className={styles.customerBook}>
                              {/* Book cover */}
                              <rect x="120" y="240" width="50" height="60" fill="#9C27B0" rx="2" />
                              {/* Book spine */}
                              <rect x="120" y="240" width="8" height="60" fill="#6A1B9A" />
                              {/* Book pages */}
                              <rect x="128" y="242" width="42" height="56" fill="#F5F5F5" rx="1" />
                              {/* Text lines */}
                              <line x1="135" y1="255" x2="165" y2="255" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="135" y1="265" x2="165" y2="265" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="135" y1="275" x2="160" y2="275" stroke="#E0E0E0" strokeWidth="1.5" />
                            </g>

                            {/* New book from delivery person */}
                            <g className={styles.deliveryBook}>
                              {/* Book cover */}
                              <rect x="330" y="240" width="50" height="60" fill="#BA68C8" rx="2" />
                              {/* Book spine */}
                              <rect x="330" y="240" width="8" height="60" fill="#9C27B0" />
                              {/* Book pages */}
                              <rect x="338" y="242" width="42" height="56" fill="#F5F5F5" rx="1" />
                              {/* Text lines */}
                              <line x1="345" y1="255" x2="375" y2="255" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="345" y1="265" x2="375" y2="265" stroke="#E0E0E0" strokeWidth="1.5" />
                              <line x1="345" y1="275" x2="370" y2="275" stroke="#E0E0E0" strokeWidth="1.5" />
                            </g>

                            {/* Exchange arrows - showing swap */}
                            <g className={styles.exchangeArrows}>
                              {/* Arrow from customer to delivery */}
                              <path d="M 170 270 L 250 270 L 250 265 L 260 270 L 250 275 L 250 270" 
                                    stroke="#9C27B0" strokeWidth="3" fill="none" strokeLinecap="round" />
                              {/* Arrow from delivery to customer */}
                              <path d="M 330 270 L 250 270 L 250 265 L 240 270 L 250 275 L 250 270" 
                                    stroke="#BA68C8" strokeWidth="3" fill="none" strokeLinecap="round" />
                            </g>

                            {/* Books in transit during exchange */}
                            <g className={styles.exchangeBooksTransit}>
                              {/* Customer's book moving to delivery person */}
                              <g className={styles.bookToDelivery}>
                                <rect x="200" y="260" width="40" height="50" fill="#9C27B0" rx="2" />
                                <rect x="200" y="260" width="6" height="50" fill="#6A1B9A" />
                                <rect x="206" y="262" width="34" height="46" fill="#F5F5F5" rx="1" />
                              </g>
                              {/* New book moving to customer */}
                              <g className={styles.bookToCustomer}>
                                <rect x="260" y="260" width="40" height="50" fill="#BA68C8" rx="2" />
                                <rect x="260" y="260" width="6" height="50" fill="#9C27B0" />
                                <rect x="266" y="262" width="34" height="46" fill="#F5F5F5" rx="1" />
                              </g>
                            </g>

                            {/* Sparkle effects during exchange */}
                            <circle cx="250" cy="270" r="6" fill="#9C27B0" className={styles.exchangeSparkle1} />
                            <circle cx="250" cy="270" r="5" fill="#BA68C8" className={styles.exchangeSparkle2} />
                            <circle cx="220" cy="250" r="4" fill="#9C27B0" className={styles.exchangeSparkle3} />
                            <circle cx="280" cy="250" r="4" fill="#BA68C8" className={styles.exchangeSparkle4} />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default HowItWorks
