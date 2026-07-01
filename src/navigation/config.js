import LogoutButton from '../components/LogoutButton';

export const commonHeaderOptions = {
    headerStyle: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowOpacity: 0.1,
    },
    headerTintColor: '#000',
    headerTitleAlign: 'center',
};

export const screenOptionsWithLogout = {
    ...commonHeaderOptions,
    headerRight: () => <LogoutButton />,
};