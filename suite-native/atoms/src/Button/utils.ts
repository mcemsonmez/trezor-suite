import { Color, TypographyStyle, nativeSpacings } from '@trezor/theme';

import { ButtonColorProps, ButtonIntent, ButtonPriority, ButtonSize, InverseKey } from './types';

const colorMapDisabled = {
    normal: 'stateContentDisabled',
    inverse: 'stateContentDisabledInverse',
} as const satisfies Record<InverseKey, Color>;

const colorMap = {
    normal: {
        primary: {
            brand: 'baseContentOnActionBrandPrimary',
            neutral: 'baseContentReversePrimary',
            info: 'baseContentOnActionInfoPrimary',
            warning: 'baseContentOnActionWarningPrimary',
            critical: 'baseContentOnActionNegativePrimary',
            accentViolet: 'baseContentOnActionAccentVioletPrimary',
            accentOrange: 'baseContentOnActionAccentOrangePrimary',
        },
        secondary: {
            brand: 'baseContentBrandContrast',
            neutral: 'baseContentNeutralContrast',
            info: 'baseContentInfoContrast',
            warning: 'baseContentWarningContrast',
            critical: 'baseContentNegativeContrast',
            accentViolet: 'baseContentAccentVioletContrast',
            accentOrange: 'baseContentAccentOrangeContrast',
        },
    },
    inverse: {
        primary: {
            brand: 'baseContentOnActionBrandPrimaryInverse',
            neutral: 'baseContentReversePrimaryInverse',
            info: 'baseContentOnActionInfoPrimaryInverse',
            warning: 'baseContentOnActionWarningPrimaryInverse',
            critical: 'baseContentOnActionNegativePrimaryInverse',
            accentViolet: 'baseContentOnActionAccentVioletPrimaryInverse',
            accentOrange: 'baseContentOnActionAccentOrangePrimaryInverse',
        },
        secondary: {
            brand: 'baseContentBrandContrastInverse',
            neutral: 'baseContentNeutralContrastInverse',
            info: 'baseContentInfoContrastInverse',
            warning: 'baseContentWarningContrastInverse',
            critical: 'baseContentNegativeContrastInverse',
            accentViolet: 'baseContentAccentVioletContrastInverse',
            accentOrange: 'baseContentAccentOrangeContrastInverse',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

const backgroundMapDisabled = {
    normal: {
        primary: 'stateFillElementBoldDisabled',
        secondary: 'stateFillElementSoftDisabled',
    },
    inverse: {
        primary: 'stateFillElementBoldInverseDisabled',
        secondary: 'stateFillElementSoftInverseDisabled',
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Color>>;

const backgroundMapBase = {
    normal: {
        primary: {
            brand: 'baseFillElementBrandBold',
            neutral: 'baseFillElementContrast',
            info: 'baseFillElementInfoBold',
            warning: 'baseFillElementWarningBold',
            critical: 'baseFillElementNegativeBold',
            accentViolet: 'baseFillElementAccentVioletBold',
            accentOrange: 'baseFillElementAccentOrangeBold',
        },
        secondary: {
            brand: 'baseFillElementBrandSoft',
            neutral: 'baseFillElementNeutralSoft',
            info: 'baseFillElementInfoSoft',
            warning: 'baseFillElementWarningSoft',
            critical: 'baseFillElementNegativeSoft',
            accentViolet: 'baseFillElementAccentVioletSoft',
            accentOrange: 'baseFillElementAccentOrangeSoft',
        },
    },
    inverse: {
        primary: {
            brand: 'baseFillElementBrandBoldInverse',
            neutral: 'baseFillElementNeutralLight',
            info: 'baseFillElementInfoBoldInverse',
            warning: 'baseFillElementWarningBoldInverse',
            critical: 'baseFillElementNegativeBoldInverse',
            accentViolet: 'baseFillElementAccentVioletBoldInverse',
            accentOrange: 'baseFillElementAccentOrangeBoldInverse',
        },
        secondary: {
            brand: 'baseFillElementBrandSoftInverse',
            neutral: 'baseFillElementNeutralSoftInverse',
            info: 'baseFillElementInfoSoftInverse',
            warning: 'baseFillElementWarningSoftInverse',
            critical: 'baseFillElementNegativeSoftInverse',
            accentViolet: 'baseFillElementAccentVioletSoftInverse',
            accentOrange: 'baseFillElementAccentOrangeSoftInverse',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

const backgroundMapPressed = {
    normal: {
        primary: {
            brand: 'stateFillElementBrandBoldPressed',
            neutral: 'stateFillElementContrastPressed',
            info: 'stateFillElementInfoBoldPressed',
            warning: 'stateFillElementWarningBoldPressed',
            critical: 'stateFillElementNegativeBoldPressed',
            accentViolet: 'stateFillElementAccentVioletBoldPressed',
            accentOrange: 'stateFillElementAccentOrangeBoldPressed',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftPressed',
            neutral: 'stateFillElementNeutralSoftPressed',
            info: 'stateFillElementInfoSoftPressed',
            warning: 'stateFillElementWarningSoftPressed',
            critical: 'stateFillElementNegativeSoftPressed',
            accentViolet: 'stateFillElementAccentVioletSoftPressed',
            accentOrange: 'stateFillElementAccentOrangeSoftPressed',
        },
    },
    inverse: {
        primary: {
            brand: 'stateFillElementBrandBoldInversePressed',
            neutral: 'stateFillElementNeutralLightPressed',
            info: 'stateFillElementInfoBoldInversePressed',
            warning: 'stateFillElementWarningBoldInversePressed',
            critical: 'stateFillElementNegativeBoldInversePressed',
            accentViolet: 'stateFillElementAccentVioletBoldInversePressed',
            accentOrange: 'stateFillElementAccentOrangeBoldInversePressed',
        },
        secondary: {
            brand: 'stateFillElementBrandSoftInversePressed',
            neutral: 'stateFillElementNeutralSoftInversePressed',
            info: 'stateFillElementInfoSoftInversePressed',
            warning: 'stateFillElementWarningSoftInversePressed',
            critical: 'stateFillElementNegativeSoftInversePressed',
            accentViolet: 'stateFillElementAccentVioletSoftInversePressed',
            accentOrange: 'stateFillElementAccentOrangeSoftInversePressed',
        },
    },
} as const satisfies Record<InverseKey, Record<ButtonPriority, Record<ButtonIntent, Color>>>;

export const buttonSizeToDimensionsMap = {
    small: {
        paddingVertical: nativeSpacings.sp4,
        paddingHorizontal: nativeSpacings.sp10,
        borderRadius: 8,
    },
    medium: {
        paddingVertical: nativeSpacings.sp8,
        paddingHorizontal: nativeSpacings.sp16,
        borderRadius: 10,
    },
    large: {
        paddingVertical: nativeSpacings.sp10,
        paddingHorizontal: nativeSpacings.sp20,
        borderRadius: 12,
    },
} as const satisfies Record<
    ButtonSize,
    { paddingVertical: number; paddingHorizontal: number; borderRadius: number }
>;

export const buttonGapMap = {
    small: 0,
    medium: nativeSpacings.sp2,
    large: nativeSpacings.sp4,
} as const satisfies Record<ButtonSize, number>;

export const buttonToTextSizeMap = {
    small: 'body-sm-strong',
    medium: 'body-sm-strong',
    large: 'body-md-strong',
} as const satisfies Record<ButtonSize, TypographyStyle>;

export const buttonToIconSizeMap = {
    small: 'medium',
    medium: 'medium',
    large: 'mediumLarge',
} as const;

export const iconButtonToIconSizeMap = {
    small: 'medium',
    medium: 'medium',
    large: 'mediumLarge',
} as const satisfies Record<ButtonSize, (typeof buttonToIconSizeMap)[ButtonSize]>;

export const iconButtonPaddingMap = {
    small: nativeSpacings.sp6,
    medium: nativeSpacings.sp10,
    large: nativeSpacings.sp12,
} as const satisfies Record<ButtonSize, number>;

export const iconButtonBorderRadiusMap = {
    small: 8,
    medium: 10,
    large: 12,
} as const satisfies Record<ButtonSize, number>;

const getInverseKey = (isInverse: boolean): InverseKey => (isInverse ? 'inverse' : 'normal');

export const getButtonContentColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: Required<ButtonColorProps> & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return colorMapDisabled[inverseKey];
    }

    return colorMap[inverseKey][priority][intent];
};

export const getButtonBackgroundColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: Required<ButtonColorProps> & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return backgroundMapDisabled[inverseKey][priority];
    }

    return backgroundMapBase[inverseKey][priority][intent];
};

export const getButtonPressedBackgroundColor = ({
    intent,
    priority,
    isDisabled,
    isInverse,
}: Required<ButtonColorProps> & { isDisabled: boolean }): Color => {
    const inverseKey = getInverseKey(isInverse);

    if (isDisabled) {
        return backgroundMapDisabled[inverseKey][priority];
    }

    return backgroundMapPressed[inverseKey][priority][intent];
};

export const getButtonColors = ({
    intent = 'brand',
    priority = 'primary',
    isDisabled,
    isInverse = false,
}: ButtonColorProps & { isDisabled: boolean }) => {
    const resolvedButtonColorProps = {
        intent,
        priority,
        isInverse,
    };

    return {
        backgroundColor: getButtonBackgroundColor({
            ...resolvedButtonColorProps,
            isDisabled,
        }),
        onPressColor: getButtonPressedBackgroundColor({
            ...resolvedButtonColorProps,
            isDisabled,
        }),
        contentColor: getButtonContentColor({
            ...resolvedButtonColorProps,
            isDisabled,
        }),
    };
};
