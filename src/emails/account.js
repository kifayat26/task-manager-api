const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
    const message = {
        to: email,
        from: 'kifayat26@gmail.com',
        subject: 'Welcome to the Task App',
        text: `Thank you ${name} for joining in our Task App Community`
    }
    sgMail.send(message)
}

const sendCancelationEmail = (name, email) => {
    const message = {
        to: email,
        from: 'kifayat26@gmail.com',
        subject: 'Sorry to see you let go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon`
    }
    sgMail.send(message)
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}