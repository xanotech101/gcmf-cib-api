import bcrypt from 'bcryptjs';

const validPassword = async () => {
    const hashedPassword = bcrypt.hashSync('user1234', 10);
    console.log(hashedPassword);
};

validPassword();