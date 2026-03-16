import { ReactNode, useCallback, useEffect } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, IconName } from '@suite-native/icons';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';

import { Loader } from '../Loader';
import { HStack } from '../Stack';
import { pressTimingConfig } from '../constants';
import { TestProps } from '../types';
import { ButtonColorProps, ButtonIntent, ButtonPriority, InverseKey } from './types';

export const TEXT_BUTTON_SIZES = ['large', 'small'] as const;
export type TextButtonSize = (typeof TEXT_BUTTON_SIZES)[number];

export type TextButtonProps = Omit<
    PressableProps,
    'children' | 'onPressIn' | 'onPressOut' | 'style'
> & {
    children?: ReactNode;
    iconLeft?: IconName;
    iconRight?: IconName;
    size?: TextButtonSize;
    style?: NativeStyleObject;
    isLoading?: boolean;
    isDisabled?: boolean;
    isUnderlined?: boolean;
} & ButtonColorProps &
    TestProps;

type TextButtonStyleProps = {
    isUnderlined: boolean;
    size: TextButtonSize;
};

type ResolvedTextButtonColorProps = Required<ButtonColorProps>;

const textButtonGapMap = {
    large: nativeSpacings.sp8,
    small: nativeSpacings.sp6,
} as const satisfies Record<TextButtonSize, number>;

const textButtonTypographyMap = {
    large: 'body-md',
    small: 'body-sm',
} as const satisfies Record<TextButtonSize, 'body-md' | 'body-sm'>;

const textButtonSpinnerSizeMap = {
    large: 20,
    small: 16,
} as const satisfies Record<TextButtonSize, number>;

const colorMap = {
    normal: {
        brand: 'baseContentBrand',
        info: 'baseContentInfo',
        warning: 'baseContentWarning',
        critical: 'baseContentNegative',
        accentViolet: 'baseContentAccentViolet',
        accentOrange: 'baseContentAccentOrange',
    },
    inverse: {
        brand: 'baseContentBrandInverse',
        info: 'baseContentInfoInverse',
        warning: 'baseContentWarningInverse',
        critical: 'baseContentNegativeInverse',
        accentViolet: 'baseContentAccentVioletInverse',
        accentOrange: 'baseContentAccentOrangeInverse',
    },
} as const satisfies Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>>;

const neutralColorMap = {
    normal: {
        primary: 'baseContentPrimary',
        secondary: 'baseContentSecondary',
    },
    inverse: {
        primary: 'baseContentPrimaryInverse',
        secondary: 'baseContentSecondaryInverse',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const colorMapPressed = {
    normal: {
        brand: 'stateContentBrandPressed',
        info: 'stateContentInfoPressed',
        warning: 'stateContentWarningPressed',
        critical: 'stateContentNegativePressed',
        accentViolet: 'stateContentAccentVioletPressed',
        accentOrange: 'stateContentAccentOrangePressed',
    },
    inverse: {
        brand: 'stateContentBrandInversePressed',
        info: 'stateContentInfoInversePressed',
        warning: 'stateContentWarningInversePressed',
        critical: 'stateContentNegativeInversePressed',
        accentViolet: 'stateContentAccentVioletInversePressed',
        accentOrange: 'stateContentAccentOrangeInversePressed',
    },
} as const satisfies Record<InverseKey, Record<Exclude<ButtonIntent, 'neutral'>, Color>>;

const neutralColorMapPressed = {
    normal: {
        primary: 'stateContentSecondaryPressed',
        secondary: 'stateContentNeutralPressed',
    },
    inverse: {
        primary: 'stateContentSecondaryInversePressed',
        secondary: 'stateContentNeutralInversePressed',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignSelf: 'flex-start',
    maxWidth: '100%',
}));

const textStyle = prepareNativeStyle<TextButtonStyleProps>((utils, { isUnderlined, size }) => ({
    ...utils.typography[textButtonTypographyMap[size]],
    flexShrink: 1,
    extend: [
        {
            condition: isUnderlined,
            style: {
                textDecorationLine: 'underline',
            },
        },
    ],
}));

const getInverseKey = (isInverse: boolean): InverseKey => (isInverse ? 'inverse' : 'normal');

const resolveTextButtonColorProps = ({
    intent = 'neutral',
    priority = 'primary',
    isInverse = false,
}: ButtonColorProps): ResolvedTextButtonColorProps => ({
    intent,
    priority,
    isInverse,
});

const getTextButtonColor = ({
    intent,
    priority,
    isInverse,
    isPressed,
}: ResolvedTextButtonColorProps & { isPressed: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (intent === 'neutral') {
        return isPressed
            ? neutralColorMapPressed[inverseKey][priority]
            : neutralColorMap[inverseKey][priority];
    }

    return isPressed ? colorMapPressed[inverseKey][intent] : colorMap[inverseKey][intent];
};

export const TextButton = ({
    children,
    disabled: isNativeDisabled,
    iconLeft,
    iconRight,
    intent = 'neutral',
    isDisabled = false,
    isInverse = false,
    isLoading = false,
    isUnderlined = false,
    priority = 'primary',
    size = 'large',
    style,
    testID,
    ...pressableProps
}: TextButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const resolvedButtonColorProps = resolveTextButtonColorProps({
        intent,
        priority,
        isInverse,
    });
    const hasDisabledVisualState = isDisabled || !!isNativeDisabled || isLoading;
    const defaultTextColor = getTextButtonColor({
        ...resolvedButtonColorProps,
        isPressed: false,
    });
    const pressedTextColor = getTextButtonColor({
        ...resolvedButtonColorProps,
        isPressed: true,
    });
    const animatedColor = useSharedValue(
        utils.colors[hasDisabledVisualState ? 'stateContentDisabled' : defaultTextColor],
    );

    const animatedTextStyle = useAnimatedStyle(() => ({
        color: animatedColor.value,
    }));

    const setAnimatedColor = useCallback(
        (color: Color) => {
            // eslint-disable-next-line react-hooks/immutability
            animatedColor.value = withTiming(utils.colors[color], pressTimingConfig);
        },
        [animatedColor, utils.colors],
    );

    useEffect(() => {
        setAnimatedColor(hasDisabledVisualState ? 'stateContentDisabled' : defaultTextColor);
    }, [defaultTextColor, hasDisabledVisualState, setAnimatedColor]);

    const handlePressIn = () => {
        setAnimatedColor(pressedTextColor);
    };

    const handlePressOut = () => {
        setAnimatedColor(defaultTextColor);
    };

    const iconColor = hasDisabledVisualState ? 'iconDisabled' : animatedColor;

    return (
        <Pressable
            disabled={hasDisabledVisualState}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[applyStyle(buttonContainerStyle), style]}
            testID={testID ? `${testID}/button` : undefined}
            {...pressableProps}
        >
            <HStack alignItems="center" justifyContent="center" spacing={textButtonGapMap[size]}>
                {isLoading && (
                    <Animated.View testID={testID ? `${testID}/loading` : undefined}>
                        <Loader
                            color="stateContentDisabled"
                            size={textButtonSpinnerSizeMap[size]}
                        />
                    </Animated.View>
                )}
                {!isLoading && !!iconLeft && (
                    <Icon.Animated
                        name={iconLeft}
                        color={iconColor}
                        size={textButtonSpinnerSizeMap[size]}
                    />
                )}
                <Animated.Text
                    numberOfLines={1}
                    style={[applyStyle(textStyle, { isUnderlined, size }), animatedTextStyle]}
                    testID={testID ? `${testID}/text` : undefined}
                >
                    {children}
                </Animated.Text>
                {!!iconRight && (
                    <Icon.Animated
                        name={iconRight}
                        color={iconColor}
                        size={textButtonSpinnerSizeMap[size]}
                    />
                )}
            </HStack>
        </Pressable>
    );
};
