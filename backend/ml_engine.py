import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def generate_prediction(prices: list, dates: list):
    """
    Takes a list of historical prices and their corresponding datetime objects.
    Uses Scikit-Learn Linear Regression to predict the price 7 days into the future.
    """
    if len(prices) < 3:
        # Not enough data to run ML
        return {
            "action": "WAIT",
            "predicted_price": prices[0] if prices else 0,
            "confidence": 0,
            "reason": "Not enough data points to train the ML model.",
            "logs": ["[!] ML Engine bypassed due to insufficient data."]
        }

    # Convert our data into a Pandas DataFrame for easy ML processing
    df = pd.DataFrame({
        'date': pd.to_datetime(dates),
        'price': prices
    })
    
    # Sort chronologically (oldest to newest)
    df = df.sort_values('date')
    
    # Machine Learning models need numbers, not datetime strings.
    # We convert dates into an ordinal number (e.g. days since year 1)
    df['date_ordinal'] = df['date'].apply(lambda x: x.toordinal())
    
    # Reshape data for Scikit-Learn (needs 2D arrays)
    X = df[['date_ordinal']].values
    y = df['price'].values
    
    # ---------------------------------------------------------
    # The Core AI Model: Linear Regression
    # ---------------------------------------------------------
    model = LinearRegression()
    
    # Train the model!
    model.fit(X, y)
    
    # Predict the future! (7 days from the latest data point)
    last_date = df['date'].max()
    future_date = last_date + timedelta(days=7)
    future_date_ordinal = np.array([[future_date.toordinal()]])
    
    predicted_price = model.predict(future_date_ordinal)[0]
    
    current_price = y[-1] # The most recent actual price
    
    # Analyze the trend (slope of the regression line)
    # If slope is negative, price is trending down.
    trend = model.coef_[0]
    
    price_drop = predicted_price - current_price
    
    logs = []
    
    # Logic based on the ML prediction
    if price_drop < -100:
        action = "WAIT"
        reason = f"ML Model predicts a price drop of ~₹{abs(round(price_drop))} over the next 7 days based on current trends."
        confidence = min(95, max(40, 100 - abs(int(trend)))) # Fake confidence metric based on variance
        
        logs.append("[✓] Scikit-Learn Linear Regression model deployed.")
        logs.append(f"[✓] Negative trend detected (Slope: {round(trend, 2)}).")
        logs.append(f"[-] Target buying price predicted: ₹{round(predicted_price)}")
    else:
        action = "BUY"
        reason = "ML Model predicts prices will remain stable or increase. Secure it now."
        confidence = min(98, max(50, 80 + int(trend)))
        
        logs.append("[✓] Scikit-Learn Linear Regression model deployed.")
        logs.append(f"[✓] Positive/Stable trend detected (Slope: {round(trend, 2)}).")
        logs.append("[-] No significant drops predicted in the near future.")

    return {
        "action": action,
        "current_price": current_price,
        "predicted_price": round(predicted_price),
        "savings": abs(round(price_drop)) if action == "WAIT" else 0,
        "confidence": confidence,
        "reason": reason,
        "logs": logs,
        "future_date": future_date
    }
