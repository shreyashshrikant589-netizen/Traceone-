import type { LucideIcon } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type InputProps = Omit<TextInputProps, 'placeholderTextColor'> & {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
};

export function Input({ label, error, helperText, icon: Icon, secureTextEntry = false, ...props }: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View className="w-full gap-2">
      {label ? <Text className="text-sm font-semibold text-navy">{label}</Text> : null}
      <View className={`min-h-[52px] flex-row items-center rounded-xl border bg-surface px-4 ${error ? 'border-danger' : 'border-border'}`}>
        {Icon ? <Icon stroke="#64748B" size={19} strokeWidth={2} /> : null}
        <TextInput
          {...props}
          className="min-w-0 flex-1 px-3 py-3 text-base text-navy"
          placeholderTextColor="#64748B"
          secureTextEntry={isSecure}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            className="p-1"
            onPress={() => setIsPasswordVisible((visible) => !visible)}>
            {isPasswordVisible ? <EyeOff stroke="#64748B" size={19} /> : <Eye stroke="#64748B" size={19} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-danger">{error}</Text> : helperText ? <Text className="text-sm text-muted">{helperText}</Text> : null}
    </View>
  );
}
