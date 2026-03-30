import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { contactInquiriesApi } from '../../utils/api'
import Input from '../../components/shared/Input/Input'
import Textarea from '../../components/shared/Textarea/Textarea'
import Button from '../../components/shared/Button/Button'
import styles from './ContactUs.module.css'

const ContactUs: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await contactInquiriesApi.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        userId: user?.id ?? null,
      })
      success('Thank you for your message! We will get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      showError('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const faqs = [
    {
      question: 'How do I schedule a waste paper pickup?',
      answer: 'You can schedule a pickup through our Waste Paper Pickup section, specifying the date and quantity.',
    },
    {
      question: 'What types of books can I sell on EcoBookHub?',
      answer: 'We accept all types of books, provided they are in good condition. Visit our Books Marketplace for more details.',
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes, once your order is confirmed, you will receive a tracking link via email.',
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can contact us using the form on this page or via email at support@ecobookhub.com.',
    },
  ]

  return (
    <div className={styles.contactUs}>
      {/* Contact Form and Info */}
      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Contact Form */}
            <div className={styles.formContainer}>
              <h1 className={styles.title}>Contact Us</h1>
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  fullWidth
                  required
                />
                <Textarea
                  label="Message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  fullWidth
                  required
                />
                <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className={styles.infoContainer}>
              <h2 className={styles.title}>Contact Information</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <strong className={styles.infoLabel}>Address:</strong>
                  <p className={styles.infoText}>123 Green Lane, Eco City, Earth 12345</p>
                </div>
                <div className={styles.infoItem}>
                  <strong className={styles.infoLabel}>Email:</strong>
                  <a href="mailto:contact@ecobookhub.com" className={styles.infoLink}>
                    contact@ecobookhub.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqCard}>
                <h3 className={styles.faqQuestion}>{faq.question}</h3>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactUs

