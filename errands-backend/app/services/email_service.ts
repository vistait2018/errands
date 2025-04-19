import app from '@adonisjs/core/services/app'
import mail from '@adonisjs/mail/services/main'

export default class EmailService {
  public async sendWelcomeEmail(
    subject: string,
    _name: string,
    info: string,
    recipient: string,
    mailFile: string = 'mails'
  ) {
    try {
      const logoUrl = app.makePath('storage/images/logo_no_bg.png')
      console.log(logoUrl)
      await mail.sendLater((message) => {
        message
          .to(recipient)
          .from('test@alphaclinic.com.ng')
          .subject(subject)
          .htmlView(`emails/${mailFile}`, { info, logoUrl, _name })
      })
      console.log('Email sent successfully.')
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }
}
