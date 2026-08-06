import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../types';
import { BucketTotals, formatMoney } from '../utils/budgetHelpers';

interface FlippableBalanceCardProps {
    totalBalance: number;
    totalIncome?: number;
    totalExpense?: number;
    buckets: BucketTotals;
    theme: Theme;
    onTransferPress: () => void;
    onSettingsPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FlippableBalanceCard: React.FC<FlippableBalanceCardProps> = ({
    totalBalance,
    totalIncome = 0,
    totalExpense = 0,
    buckets,
    theme,
    onTransferPress,
    onSettingsPress,
}) => {
    const flip = useSharedValue(0);

    const frontStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1200 },
            { rotateY: `${interpolate(flip.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` },
        ],
        opacity: interpolate(flip.value, [0, 85, 95, 180], [1, 1, 0, 0], Extrapolation.CLAMP),
    }));

    const backStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1200 },
            { rotateY: `${interpolate(flip.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` },
        ],
        opacity: interpolate(flip.value, [0, 85, 95, 180], [0, 0, 1, 1], Extrapolation.CLAMP),
    }));

    const toggleFlip = () => {
        flip.value = withTiming(flip.value === 0 ? 180 : 0, { duration: 450 });
    };

    return (
        <View style={{ minHeight: 230 }}>
            <AnimatedPressable
                onPress={toggleFlip}
                style={{
                    borderRadius: 24,
                    minHeight: 230,
                    overflow: 'hidden',
                    elevation: 6,
                    shadowColor: '#5236FF',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                }}
            >
                {/* FRONT SIDE (PURPLE GRADIENT WITH INCOME & EXPENSE) */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backfaceVisibility: 'hidden',
                        },
                        frontStyle,
                    ]}
                >
                    <LinearGradient
                        colors={['#5C46FF', '#8931FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1, padding: 22, justifyContent: 'space-between' }}
                    >
                        {/* Header Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, fontWeight: '500' }}>
                                Total Balance
                            </Text>

                            {/* Optional Flip Icon */}
                            <TouchableOpacity onPress={toggleFlip} style={{ padding: 4 }}>
                                <Ionicons name="swap-horizontal" size={20} color="rgba(255, 255, 255, 0.8)" />
                            </TouchableOpacity>
                        </View>

                        {/* Balance Amount */}
                        <View style={{ marginVertical: 6 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '800', letterSpacing: -0.5 }}>
                                ₱{formatMoney(totalBalance)}
                            </Text>
                        </View>

                        {/* Income & Expense Row with Vertical Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            {/* Income */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
                                    Income
                                </Text>
                                <Text style={{ color: '#00E676', fontSize: 18, fontWeight: '700' }}>
                                    +₱{formatMoney(totalIncome)}
                                </Text>
                            </View>

                            {/* Vertical Middle Line Divider */}
                            <View
                                style={{
                                    width: 1,
                                    height: 36,
                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                    marginHorizontal: 16,
                                }}
                            />

                            {/* Expense */}
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
                                    Expense
                                </Text>
                                <Text style={{ color: '#FF708A', fontSize: 18, fontWeight: '700' }}>
                                    -₱{formatMoney(totalExpense)}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* BACK SIDE (BUCKET BREAKDOWN) */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backfaceVisibility: 'hidden',
                        },
                        backStyle,
                    ]}
                >
                    <LinearGradient
                        colors={['#1E1B4B', '#312E81']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Bucket Breakdown</Text>
                            <TouchableOpacity onPress={onSettingsPress} style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12 }}>
                                <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 8, marginVertical: 6 }}>
                            {([
                                { label: 'Needs', value: buckets.needs, color: '#38BDF8' },
                                { label: 'Wants', value: buckets.wants, color: '#FBBF24' },
                                { label: 'Others', value: buckets.others, color: '#A78BFA' },
                            ] as const).map((bucket) => (
                                <View
                                    key={bucket.label}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        borderRadius: 12,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bucket.color }} />
                                        <Text style={{ color: '#E0E7FF', fontSize: 13, fontWeight: '600' }}>{bucket.label}</Text>
                                    </View>
                                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>₱{formatMoney(bucket.value)}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={onTransferPress}
                                style={{ flex: 1, backgroundColor: '#5236FF', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Transfer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={toggleFlip}
                                style={{ width: 44, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="swap-horizontal-outline" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </AnimatedPressable>
        </View>
    );
};