# Backend Developer Technical Study Case

This application has been developed to address a set of requirements for the role of a Backend Developer. Here are the main features and functionalities:

## Application Requirements

- **Users, Support Team, Finance Team, and Administrators**: The system has been designed to have different user types, each with different roles and permissions. These user types include normal users, a support team, a finance team, and administrators. This segregation helps ensure that each user type only accesses the areas of the system relevant to their role.

- **Access Control**: It has been ensured that the support team does not have access to the user's sensitive information. Only administrators have the necessary permissions to form the support and finance teams.

- **Multi-Currency Accounts**: Users can have accounts for more than one currency. Currently, the system supports USD, TR, and EUR.

- **Unique Account Numbers**: Every user has a unique account number that can be used by everyone. This facilitates easy identification and transaction processing.

- **Account Visibility**: Users have the ability to see the balance in their accounts and their account activity through a ledger. This transparency allows users to have a clear understanding of their financial activities.

- **Bank Deposits**: Users can deposit money in banks defined by the finance team. Current banks include BANK A and BANK B.

- **Bank Account Management**: The application provides the functionality for users to add, delete, and view bank accounts as per their needs.

- **Withdrawal Requests**: Users can create a withdrawal request to the bank account added. For added security, the user must go through phone number and identity verification in order to submit a withdrawal request.

- **Withdrawal Processing**: After the withdrawal request, the finance team has the authority to either accept or reject the withdrawal request. If the withdrawal request is not processed, the user has the option to cancel the withdrawal request.

- **Partner Payments**: Users can make and receive payments to and from our partners with the balance in their wallets. This provides users with the flexibility to manage their finances efficiently.

This application has been developed with a focus on user experience, system efficiency, and security. All functionalities have been tested thoroughly to ensure optimal performance. The aim was to develop an application that not only fulfils the given requirements but also provides a strong base for further enhancements if needed.

For a detailed walkthrough of how the system works, check out the [YouTube Video Walkthrough](https://www.youtube.com/watch?v=qJ1C4unT2AM).
