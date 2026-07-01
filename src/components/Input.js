import React, { useState, forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Input = forwardRef(({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType = 'default',
  onSubmitEditing,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  multiline = false,
  maxLength,
  style,
  inputStyle,
  placeholderTextColor = '#999',
  selectionColor = '#2196F3',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [animatedValue] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setIsSecure(!isSecure);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#F44336' : '#E0E0E0', error ? '#F44336' : '#2196F3'],
  });

  const labelColor = error ? '#F44336' : isFocused ? '#2196F3' : '#666';

  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.inputContainer, 
          { borderColor },
          disabled && styles.disabledContainer
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon 
              name={leftIcon} 
              size={20} 
              color={error ? '#F44336' : isFocused ? '#2196F3' : '#999'} 
            />
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            inputStyle,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            disabled && styles.disabledInput
          ]}
          placeholder={placeholder}
          placeholderTextColor={error ? '#FFCDD2' : placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          maxLength={maxLength}
          selectionColor={selectionColor}
          underlineColorAndroid="transparent"
          {...props}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={handleRightIconPress}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            <Icon 
              name={secureTextEntry ? (isSecure ? 'visibility' : 'visibility-off') : rightIcon} 
              size={20} 
              color={error ? '#F44336' : isFocused ? '#2196F3' : '#999'} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={14} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {maxLength && (
        <Text style={styles.characterCount}>
          {value ? value.length : 0}/{maxLength}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#FFF',
    minHeight: 50,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  disabledContainer: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  multilineInput: {
    minHeight: 100,
    maxHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  disabledInput: {
    color: '#999',
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
    flex: 1,
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});

Input.displayName = 'Input';

export default Input;