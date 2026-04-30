const userRepository = require('../repositories/userRepository');

const getAllUsers = async (req, res) => {
    try {
        const users = await userRepository.findAllUsers();
        // Remove passwords from the response
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.status(200).json(sanitizedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;
        
        console.log(`Updating user ${id} with:`, { name, role, status });
        
        const updatedUser = await userRepository.updateUser(id, { name, role, status });
        const { password, ...sanitizedUser } = updatedUser;
        
        res.status(200).json(sanitizedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await userRepository.deleteUser(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser
};
