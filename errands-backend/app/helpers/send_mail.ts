import mail from '@adonisjs/mail/services/main'

const mailRecipient = 'jidedorcas@gmail.com'

const sendMail = async (subject: string, info: string) => {
  try {
    await mail.sendLater((message) => {
      message
        .to(mailRecipient)
        .from('test@alphaclinic.com.ng')
        .subject(subject)
        .html(`<p>${info}</p>`)
    })
    console.log('Email sent successfully.')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

export default sendMail
